import { NextResponse } from "next/server";
import { z } from "zod";
import { workPilotAgent } from "@/lib/agent/workpilot-agent";

const runSchema = z.object({
  goal: z.string().min(1, "Goal is required"),
  params: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = runSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await workPilotAgent.run(parsed.data.goal, parsed.data.params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Agent run failed:", error);
    return NextResponse.json(
      { error: "Agent execution failed", message: String(error) },
      { status: 500 }
    );
  }
}
