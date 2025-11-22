import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { validateBridgeCredentials } from "@/lib/bridge-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STORAGE_ROOT = process.env.BRIDGE_STORAGE_ROOT || "/tmp/bridges";

export async function POST(req: NextRequest) {
  const auth = await validateBridgeCredentials(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const manifest = await req.text();
  if (!manifest) {
    return NextResponse.json({ error: "Manifest body is required" }, { status: 400 });
  }

  const bridgeDir = path.join(STORAGE_ROOT, auth.bridgeId);
  const manifestPath = path.join(bridgeDir, "index.m3u8");

  try {
    await fs.mkdir(bridgeDir, { recursive: true });
    await fs.writeFile(manifestPath, manifest, "utf8");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to store manifest", error);
    return NextResponse.json({ error: "Unable to save manifest" }, { status: 500 });
  }
}
