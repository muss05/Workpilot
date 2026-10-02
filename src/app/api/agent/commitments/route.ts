import { NextResponse } from "next/server";
import { z } from "zod";
import { getCommitments, updateCommitmentStatus } from "@/lib/memory/store";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["detected", "task_created", "reminded", "completed", "dismissed"]),
});

export async function GET() {
  try {
    const commitments = await getCommitments();
    return NextResponse.json(commitments);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch commitments", message: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = updateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updated = await updateCommitmentStatus(parsed.data.id, parsed.data.status);
    if (!updated) {
      return NextResponse.json({ error: "Commitment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, commitment: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update commitment", message: String(error) },
      { status: 500 }
    );
  }
}
