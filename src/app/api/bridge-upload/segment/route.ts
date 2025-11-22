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

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const fileNameField = formData.get("filename");
  const rawName = typeof fileNameField === "string" && fileNameField.trim() ? fileNameField : file.name;
  const safeName = path.basename(rawName || `segment-${Date.now()}.ts`);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const bridgeDir = path.join(STORAGE_ROOT, auth.bridgeId);
    await fs.mkdir(bridgeDir, { recursive: true });
    await fs.writeFile(path.join(bridgeDir, safeName), buffer);
    return NextResponse.json({ success: true, file: safeName });
  } catch (error) {
    console.error("Failed to store segment", error);
    return NextResponse.json({ error: "Unable to save segment" }, { status: 500 });
  }
}
