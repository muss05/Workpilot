export interface AIProvider {
  name: string;
  isMock: boolean;
  generateText(prompt: string, fallbackText: string): Promise<string>;
  generateStructured<T>(
    prompt: string,
    schemaInstruction: string,
    fallback: T
  ): Promise<T>;
}

export class DeterministicMockProvider implements AIProvider {
  name = "DeterministicMockProvider";
  isMock = true;

  async generateText(_prompt: string, fallbackText: string): Promise<string> {
    // Returns realistic AI generated text instantly
    return fallbackText;
  }

  async generateStructured<T>(
    _prompt: string,
    _schemaInstruction: string,
    fallback: T
  ): Promise<T> {
    // In mock mode, returns the structured validated deterministic payload
    return fallback;
  }
}

export class OpenAIProvider implements AIProvider {
  name = "OpenAIProvider";
  isMock = false;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateText(prompt: string, fallbackText: string): Promise<string> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "You are WorkPilot, an autonomous AI work operations agent for software engineering teams.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        console.warn(`OpenAI API returned status ${response.status}. Using fallback.`);
        return fallbackText;
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || fallbackText;
    } catch (err) {
      console.error("OpenAI call failed, falling back:", err);
      return fallbackText;
    }
  }

  async generateStructured<T>(
    prompt: string,
    schemaInstruction: string,
    fallback: T
  ): Promise<T> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: `You are WorkPilot. Respond STRICTLY in valid JSON matching this schema instruction: ${schemaInstruction}. Do not output markdown backticks or commentary.`,
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        return fallback;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return fallback;

      return JSON.parse(content) as T;
    } catch {
      return fallback;
    }
  }
}

export class AnthropicProvider implements AIProvider {
  name = "AnthropicProvider";
  isMock = false;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "claude-3-5-sonnet-20241022") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateText(prompt: string, fallbackText: string): Promise<string> {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        return fallbackText;
      }

      const data = await response.json();
      return data.content?.[0]?.text || fallbackText;
    } catch {
      return fallbackText;
    }
  }

  async generateStructured<T>(
    prompt: string,
    schemaInstruction: string,
    fallback: T
  ): Promise<T> {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: `${prompt}\n\nSTRICT JSON ONLY according to: ${schemaInstruction}. Output raw JSON only.`,
            },
          ],
        }),
      });

      if (!response.ok) return fallback;

      const data = await response.json();
      const text = data.content?.[0]?.text;
      if (!text) return fallback;

      // Extract JSON if wrapped in code blocks
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson) as T;
    } catch {
      return fallback;
    }
  }
}

export function getAIProvider(): AIProvider {
  const providerType = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (providerType === "openai" && openaiKey) {
    return new OpenAIProvider(openaiKey);
  }

  if (providerType === "anthropic" && anthropicKey) {
    return new AnthropicProvider(anthropicKey);
  }

  if (openaiKey) {
    return new OpenAIProvider(openaiKey);
  }

  if (anthropicKey) {
    return new AnthropicProvider(anthropicKey);
  }

  return new DeterministicMockProvider();
}
