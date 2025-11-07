import { NextRequest } from "next/server";
import { createReadStream } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "cam";
  const file = req.nextUrl.searchParams.get("file") ?? "index.m3u8";
  const target = path.join(`/tmp/hls/${id}`, file);

  try {
    const stream = createReadStream(target);
    const contentType = file.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : "video/MP2T";
    return new Response(stream as any, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return new Response("Not ready", { status: 404 });
  }
}
