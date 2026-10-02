import { NextResponse } from "next/server";
import { z } from "zod";
import { approveTimeLogDraft, discardTimeLogDraft } from "@/lib/memory/store";

const draftActionSchema = z.object({
  draftId: z.string().min(1, "Draft ID is required"),
  action: z.enum(["approve", "discard"]),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = draftActionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { draftId, action } = parsed.data;

    if (action === "approve") {
      const result = await approveTimeLogDraft(draftId);
      if (!result.success) {
        return NextResponse.json(
          { error: result.message || "Failed to approve draft" },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    }

    if (action === "discard") {
      const removed = await discardTimeLogDraft(draftId);
      return NextResponse.json({
        success: removed,
        message: removed ? "Time log draft dismissed." : "Draft not found.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process draft action", message: String(error) },
      { status: 500 }
    );
  }
}
