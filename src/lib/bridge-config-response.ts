import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { getBridgeStore } from "@/lib/bridge-store";

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Authentication is required.", status: 401 as const };
  }

  const token = authHeader.slice("Bearer ".length);

  if (admin.apps.length > 0) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      return { uid: decoded.uid };
    } catch (error) {
      console.error("Failed to verify auth token", error);
      return { error: "Invalid or expired session. Please sign in again.", status: 401 as const };
    }
  }

  // Development fallback – trust opaque token as uid
  return { uid: token };
}

export async function createBridgeConfigResponse(
  req: NextRequest,
  bridgeId?: string,
) {
  if (!bridgeId) {
    return NextResponse.json(
      { error: "Bridge ID is required to generate a config file." },
      { status: 400 },
    );
  }

  try {
    const authResult = await authenticate(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const store = await getBridgeStore();
    const data = await store.get(bridgeId);

    if (!data) {
      return NextResponse.json(
        { error: "Bridge not found. Please create a new bridge and try again." },
        { status: 404 },
      );
    }

    if (!data.userId || data.userId !== authResult.uid) {
      return NextResponse.json({ error: "You do not have access to this bridge." }, { status: 403 });
    }

    const rtspUrl = data.rtspUrl;
    const apiKey = data.apiKey;

    if (!rtspUrl || !apiKey) {
      return NextResponse.json(
        { error: "Bridge is missing configuration details." },
        { status: 422 },
      );
    }

    const backendUrl =
      data.backendUrl || process.env.NEXT_PUBLIC_BRIDGE_BACKEND_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    const config = {
      bridgeId,
      apiKey,
      rtspUrl,
      backendUrl,
    } satisfies Record<string, string>;

    return new NextResponse(JSON.stringify(config, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=\"agent-config.json\"",
      },
    });
  } catch (error) {
    console.error("Failed to generate bridge config", error);
    return NextResponse.json(
      { error: "We couldn’t create the bridge config. Please try again later." },
      { status: 500 },
    );
  }
}
