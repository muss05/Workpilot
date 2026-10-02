import { NextResponse } from "next/server";
import { getActivityTimeline } from "@/lib/memory/store";

export async function GET() {
  try {
    const activity = await getActivityTimeline();
    return NextResponse.json(activity);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch activity timeline", message: String(error) },
      { status: 500 }
    );
  }
}
