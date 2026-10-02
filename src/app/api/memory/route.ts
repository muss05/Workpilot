import { NextResponse } from "next/server";
import { getMemoryItems, resetDemoState } from "@/lib/memory/store";

export async function GET() {
  try {
    const memory = await getMemoryItems();
    return NextResponse.json(memory);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch agent memory", message: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    if (json.action === "reset") {
      await resetDemoState();
      return NextResponse.json({ success: true, message: "Workspace memory reset to initial demo state." });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Memory operation failed", message: String(error) },
      { status: 500 }
    );
  }
}
