import { NextResponse } from "next/server";
import { workPilotAgent } from "@/lib/agent/workpilot-agent";
import { logActivity } from "@/lib/memory/store";

export async function GET(request: Request) {
  // Verify Vercel Cron authorization header if CRON_SECRET is configured
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await workPilotAgent.run("morning_brief");

    await logActivity({
      title: "Scheduled Cron: Morning Brief Synthesized",
      description: "Triggered via Vercel Cron (schedule: 08:30 AM daily). 5 sources analyzed, actions staged.",
      category: "agent",
      status: "success",
      toolUsed: "vercel_cron",
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      agentStatus: result.status,
      recommendationsCount: result.recommendations.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Cron run failed", message: String(error) },
      { status: 500 }
    );
  }
}
