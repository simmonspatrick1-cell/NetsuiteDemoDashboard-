import { NextResponse } from "next/server";
import { getInfo } from "@/lib/netsuite";

function parseScriptDeploy(url?: string) {
  if (!url) return {} as { script?: string; deploy?: string };
  try {
    const u = new URL(url);
    const script = u.searchParams.get("script") || undefined;
    const deploy = u.searchParams.get("deploy") || undefined;
    return { script, deploy };
  } catch {
    return {} as { script?: string; deploy?: string };
  }
}

export async function GET() {
  try {
    const restletUrl = process.env.NETSUITE_DEMO_RESTLET_URL || "";
    const { script, deploy } = parseScriptDeploy(restletUrl);

    const info = await getInfo();

    return NextResponse.json({
      success: info.success,
      script,
      deploy,
      restletUrl,
      restletInfo: info.data || null,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      restletUrl: process.env.NETSUITE_DEMO_RESTLET_URL || "Missing",
    }, { status: 500 });
  }
}
