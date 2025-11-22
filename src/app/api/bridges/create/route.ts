import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { buildBridgeRecord, getBridgeStore } from "@/lib/bridge-store";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

const payloadSchema = z.object({
  host: z.string().min(1, "host is required"),
  port: z.coerce.number().int().min(1).max(65535),
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
  streamPath: z
    .string()
    .min(1, "streamPath is required")
    .transform((value) => (value.startsWith("/") ? value : `/${value}`)),
});

function buildRtspUrl({
  host,
  port,
  username,
  password,
  streamPath,
}: z.infer<typeof payloadSchema>) {
  const encodedUsername = encodeURIComponent(username);
  const encodedPassword = encodeURIComponent(password);
  return `rtsp://${encodedUsername}:${encodedPassword}@${host}:${port}${streamPath}`;
}

export async function POST(req: NextRequest) {
  try {
    const parsedBody = payloadSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      const message = parsedBody.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return NextResponse.json({ error: message }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication is required to create a bridge." },
        { status: 401 },
      );
    }

    const token = authHeader.slice("Bearer ".length);

    try {
      await initFirebaseAdmin();
    } catch (error) {
      console.warn("Firebase admin unavailable, falling back to opaque uid", error);
    }

    let userId: string;
    if (admin.apps.length > 0) {
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        userId = decoded.uid;
      } catch (error) {
        console.error("Failed to verify auth token", error);
        return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
      }
    } else {
      userId = token;
    }

    const payload = parsedBody.data;
    const apiKey = randomBytes(32).toString("hex");
    const rtspUrl = buildRtspUrl(payload);
    const backendUrl =
      process.env.NEXT_PUBLIC_BRIDGE_BACKEND_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin;
    const agentDownloadUrl = process.env.NEXT_PUBLIC_WINDOWS_AGENT_URL || "";

    const record = buildBridgeRecord({
      userId,
      rtspUrl,
      apiKey,
      backendUrl,
    });

    const store = await getBridgeStore();

    let createdRecord = record;
    try {
      createdRecord = await store.create(record);
    } catch (error) {
      console.error("Failed to create bridge record", error);
      return NextResponse.json(
        {
          error: "We couldn’t create the bridge. Please check your camera details and try again.",
        },
        { status: 500 },
      );
    }

    const configUrl = `/api/bridges/${record.id}/config`;

    return NextResponse.json({
      bridgeId: createdRecord.id,
      apiKey,
      rtspUrl,
      backendUrl,
      agentDownloadUrl,
      configDownloadUrl: configUrl,
      configDownloadPath: configUrl,
      config: {
        bridgeId: createdRecord.id,
        apiKey,
        rtspUrl,
        backendUrl,
      },
    });
  } catch (error) {
    console.error("Unexpected bridge creation error", error);
    return NextResponse.json(
      { error: "We couldn’t create the bridge. Please check your camera details and try again." },
      { status: 500 },
    );
  }
}
