import { NextResponse } from "next/server";
import { z } from "zod";
import { workPilotAgent } from "@/lib/agent/workpilot-agent";
import { getReleases } from "@/lib/memory/store";

const releaseQuerySchema = z.object({
  version: z.string().optional().default("10.14.0.6"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version") || "10.14.0.6";

    const releases = await getReleases();
    const release = releases.find((r) => r.version === version) || releases[0];

    return NextResponse.json(release);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch release analysis", message: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = releaseQuerySchema.safeParse(json);

    const version = parsed.success ? parsed.data.version : "10.14.0.6";

    // Run agent release analysis loop
    await workPilotAgent.run("analyze_release", { version });

    const releases = await getReleases();
    const release = releases.find((r) => r.version === version) || releases[0];

    return NextResponse.json({ success: true, release });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to execute release investigation", message: String(error) },
      { status: 500 }
    );
  }
}
