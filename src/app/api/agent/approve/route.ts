import { NextResponse } from "next/server";
import { z } from "zod";
import { approveAction, rejectAction } from "@/lib/memory/store";

const decisionSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = decisionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { id, decision, notes } = parsed.data;

    if (decision === "approve") {
      const result = await approveAction(id, notes);
      if (!result.action) {
        return NextResponse.json({ error: "Action not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "Action approved and dispatched to destination.",
        action: result.action,
      });
    } else {
      const result = await rejectAction(id, notes);
      if (!result.action) {
        return NextResponse.json({ error: "Action not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "Action rejected by human operator.",
        action: result.action,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process approval decision", message: String(error) },
      { status: 500 }
    );
  }
}
