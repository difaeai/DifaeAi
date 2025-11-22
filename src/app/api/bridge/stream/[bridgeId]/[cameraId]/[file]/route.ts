import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { bridgeId: string; cameraId: string; file: string } },
) {
  const { bridgeId, cameraId, file } = params;

  if (!bridgeId || !cameraId || !file) {
    return new Response(JSON.stringify({ error: "Missing identifiers" }), { status: 400 });
  }

  const storageDir = path.join(process.cwd(), "storage", "streams", bridgeId, cameraId);
  const filePath = path.join(storageDir, file);

  try {
    await fs.access(filePath);
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const contentType = file.endsWith(".m3u8")
    ? "application/vnd.apple.mpegurl"
    : file.endsWith(".ts")
      ? "video/mp2t"
      : "application/octet-stream";

  const data = await fs.readFile(filePath);
  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
