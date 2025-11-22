import { NextRequest, NextResponse } from "next/server";
import { saveManifest } from "@/lib/bridge-storage";
import { validateBridgeApiKey } from "@/lib/bridge-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function readManifestBody(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") || formData.get("manifest");
    if (file instanceof File) {
      return Buffer.from(await file.arrayBuffer());
    }
    const text = typeof file === "string" ? file : "";
    if (text.trim()) return Buffer.from(text);
    return null;
  }

  const textBody = await req.text();
  return textBody ? Buffer.from(textBody) : null;
}

export async function POST(req: NextRequest, { params }: { params: { bridgeId?: string } }) {
  const bridgeId = params.bridgeId;
  if (!bridgeId) {
    return NextResponse.json({ error: "bridgeId is required" }, { status: 400 });
  }

  const auth = await validateBridgeApiKey(bridgeId, req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await readManifestBody(req);
  if (!body) {
    return NextResponse.json({ error: "Manifest body is required" }, { status: 400 });
  }

  try {
    await saveManifest(bridgeId, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to store manifest", error);
    return NextResponse.json({ error: "Unable to save manifest" }, { status: 500 });
  }
}
