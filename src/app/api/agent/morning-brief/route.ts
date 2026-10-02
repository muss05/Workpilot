import { NextResponse } from "next/server";
import { workPilotAgent } from "@/lib/agent/workpilot-agent";
import { getMorningBrief } from "@/lib/memory/store";

export async function GET() {
  try {
    const brief = await getMorningBrief();
    return NextResponse.json(brief);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch morning brief", message: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Run the WorkPilot agent to refresh the morning analysis
    await workPilotAgent.run("morning_brief");
    const brief = await getMorningBrief();
    return NextResponse.json({ success: true, brief });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to execute morning analysis", message: String(error) },
      { status: 500 }
    );
  }
}
