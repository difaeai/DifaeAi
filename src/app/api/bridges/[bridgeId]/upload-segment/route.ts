import { NextRequest, NextResponse } from "next/server";
import { saveSegment } from "@/lib/bridge-storage";
import { validateBridgeApiKey } from "@/lib/bridge-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function extractSegment(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return { error: "File is required" } as const;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    return { buffer, name: file.name } as const;
  }

  const nameHeader =
    req.headers.get("x-bridge-segment") ||
    req.headers.get("x-file-name") ||
    `segment-${Date.now()}.ts`;
  const buffer = Buffer.from(await req.arrayBuffer());
  return { buffer, name: nameHeader } as const;
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

  const payload = await extractSegment(req);
  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: 400 });
  }

  try {
    const savedName = await saveSegment(bridgeId, payload.name, payload.buffer);
    return NextResponse.json({ success: true, file: savedName });
  } catch (error) {
    console.error("Failed to store segment", error);
    return NextResponse.json({ error: "Unable to save segment" }, { status: 500 });
  }
}
