import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { mkdir, stat } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

async function waitForFile(
  filePath: string,
  timeoutMs = 7000,
  pollIntervalMs = 250
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await stat(filePath);
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }
  return false;
}

export async function GET(req: NextRequest) {
  const rtsp = req.nextUrl.searchParams.get("rtsp");
  const id = req.nextUrl.searchParams.get("id") ?? "cam";
  if (!rtsp) {
    return new Response("Missing rtsp", { status: 400 });
  }

  const outDir = `/tmp/hls/${id}`;
  await mkdir(outDir, { recursive: true });
  const playlist = path.join(outDir, "index.m3u8");

  let playlistReady = false;
  try {
    await stat(playlist);
    playlistReady = true;
  } catch {
    playlistReady = false;
  }

  if (!playlistReady) {
    const args = [
      "-rtsp_transport",
      "tcp",
      "-i",
      rtsp,
      "-fflags",
      "nobuffer",
      "-flags",
      "low_delay",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-tune",
      "zerolatency",
      "-f",
      "hls",
      "-hls_time",
      "2",
      "-hls_list_size",
      "6",
      "-hls_flags",
      "delete_segments",
      path.join(outDir, "index.m3u8"),
    ];

    try {
      spawn("ffmpeg", args, { stdio: "ignore", detached: true }).unref();
    } catch (error) {
      return new Response(
        error instanceof Error ? error.message : "Failed to start ffmpeg",
        { status: 500 }
      );
    }

    const available = await waitForFile(playlist);
    if (!available) {
      return new Response("Stream initialization timed out", { status: 504 });
    }
  }

  return Response.json({ ok: true, hls: `/api/hls?id=${id}` });
}
