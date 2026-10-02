import { NextResponse } from "next/server";
import { z } from "zod";
import { githubClient } from "@/lib/integrations/clients/github-client";
import { jiraClient } from "@/lib/integrations/clients/jira-client";

const testSchema = z.object({
  type: z.enum(["github", "jira"]),
  githubToken: z.string().optional(),
  jiraDomain: z.string().optional(),
  jiraEmail: z.string().optional(),
  jiraApiToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = testSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { type, githubToken, jiraDomain, jiraEmail, jiraApiToken } = parsed.data;

    if (type === "github") {
      if (!githubToken || githubToken.trim().length === 0) {
        return NextResponse.json(
          { valid: false, error: "Please provide a GitHub Personal Access Token." },
          { status: 400 }
        );
      }

      const res = await githubClient.verifyCredentials(githubToken);
      if (!res.valid) {
        return NextResponse.json(
          { valid: false, error: res.error || "GitHub authentication failed." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        valid: true,
        message: `Connection successful! Authenticated as @${res.user?.login}.`,
        user: res.user,
      });
    }

    if (type === "jira") {
      if (!jiraDomain || !jiraEmail || !jiraApiToken) {
        return NextResponse.json(
          { valid: false, error: "Please provide Jira Domain, Email, and API Token." },
          { status: 400 }
        );
      }

      const res = await jiraClient.verifyCredentials(jiraDomain, jiraEmail, jiraApiToken);
      if (!res.valid) {
        return NextResponse.json(
          { valid: false, error: res.error || "Jira authentication failed." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        valid: true,
        message: `Connection successful! Connected to ${jiraClient.cleanDomain(jiraDomain)} as ${res.user?.displayName}.`,
        user: res.user,
      });
    }

    return NextResponse.json({ error: "Unsupported integration type." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: `Connection test error: ${String(err)}` },
      { status: 500 }
    );
  }
}
