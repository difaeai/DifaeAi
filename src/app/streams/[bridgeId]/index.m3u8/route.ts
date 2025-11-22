import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STORAGE_ROOT = process.env.BRIDGE_STORAGE_ROOT || "/tmp/bridges";

export async function GET(_req: NextRequest, { params }: { params: { bridgeId?: string } }) {
  const bridgeId = params.bridgeId;
  if (!bridgeId) {
    return NextResponse.json({ error: "Bridge ID is required" }, { status: 400 });
  }

  const manifestPath = path.join(STORAGE_ROOT, bridgeId, "index.m3u8");

  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const normalized = raw
      .split(/\r?\n/)
      .map((line) => {
        if (!line || line.startsWith("#")) return line;
        if (line.startsWith("http")) return line;
        const safe = path.basename(line.trim());
        return `/streams/${bridgeId}/${safe}`;
      })
      .join("\n");

    return new NextResponse(normalized, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
      },
    });
  } catch (error) {
    console.error("Failed to serve manifest", error);
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }
}
