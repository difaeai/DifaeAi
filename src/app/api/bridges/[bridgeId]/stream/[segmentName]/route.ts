import { NextRequest, NextResponse } from "next/server";
import { readSegment } from "@/lib/bridge-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { bridgeId?: string; segmentName?: string } },
) {
  const { bridgeId, segmentName } = params;
  if (!bridgeId || !segmentName) {
    return NextResponse.json({ error: "bridgeId and segmentName are required" }, { status: 400 });
  }

  try {
    const segment = await readSegment(bridgeId, segmentName);
    return new NextResponse(segment, {
      status: 200,
      headers: { "Content-Type": "video/MP2T" },
    });
  } catch (error) {
    console.error("Segment not available", error);
    return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  }
}
