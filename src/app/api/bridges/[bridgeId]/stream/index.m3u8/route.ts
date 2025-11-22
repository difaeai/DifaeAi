import { NextRequest, NextResponse } from "next/server";
import { readManifest } from "@/lib/bridge-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { bridgeId?: string } },
) {
  const bridgeId = params.bridgeId;
  if (!bridgeId) {
    return NextResponse.json({ error: "bridgeId is required" }, { status: 400 });
  }

  try {
    const manifest = await readManifest(bridgeId);
    return new NextResponse(manifest, {
      status: 200,
      headers: { "Content-Type": "application/vnd.apple.mpegurl" },
    });
  } catch (error) {
    console.error("Manifest not available", error);
    return NextResponse.json({ error: "Manifest not found" }, { status: 404 });
  }
}
