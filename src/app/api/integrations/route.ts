import { NextResponse } from "next/server";
import { getActiveIntegrationAdapter } from "@/lib/integrations/real-adapter";

export async function GET() {
  try {
    const adapter = getActiveIntegrationAdapter();
    const integrations = await adapter.getIntegrations();
    return NextResponse.json({
      adapterName: adapter.name,
      isDemo: adapter.isDemo,
      integrations,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch integrations", message: String(error) },
      { status: 500 }
    );
  }
}
