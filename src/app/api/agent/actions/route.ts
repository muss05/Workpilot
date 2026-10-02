import { NextResponse } from "next/server";
import { z } from "zod";
import { getActions, updateActionDraft } from "@/lib/memory/store";

const editDraftSchema = z.object({
  id: z.string().min(1),
  draftContent: z.string().min(1),
});

export async function GET() {
  try {
    const actions = await getActions();
    return NextResponse.json(actions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch actions", message: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const parsed = editDraftSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await updateActionDraft(parsed.data.id, parsed.data.draftContent);
    if (!result.action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, action: result.action });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update action draft", message: String(error) },
      { status: 500 }
    );
  }
}
