import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STORAGE_ROOT = process.env.BRIDGE_STORAGE_ROOT || "/tmp/bridges";

export async function GET(_req: NextRequest, { params }: { params: { bridgeId?: string; segment?: string } }) {
  const bridgeId = params.bridgeId;
  const segment = params.segment;

  if (!bridgeId || !segment) {
    return NextResponse.json({ error: "Bridge and segment are required" }, { status: 400 });
  }

  const safeName = path.basename(segment);
  const segmentPath = path.join(STORAGE_ROOT, bridgeId, safeName);

  try {
    const buffer = await fs.readFile(segmentPath);
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "video/mp2t" },
    });
  } catch (error) {
    console.error("Failed to serve segment", error);
    return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  }
}
