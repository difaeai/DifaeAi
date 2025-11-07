import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "DIFAE/1.0" },
    });
    if (!upstream.ok || !upstream.body) {
      return new Response("Camera offline", { status: 502 });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "multipart/x-mixed-replace",
      },
    });
  } catch (error) {
    return new Response("Camera offline", { status: 502 });
  }
}
