import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
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

    try {
      await initFirebaseAdmin();
    } catch (error) {
      console.error("Failed to initialise Firebase Admin", error);
      return NextResponse.json(
        { error: "Backend services are unavailable right now. Try again later." },
        { status: 503 },
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication is required to create a bridge." },
        { status: 401 },
      );
    }

    let userId: string;
    try {
      const token = authHeader.slice("Bearer ".length);
      const decoded = await admin.auth().verifyIdToken(token);
      userId = decoded.uid;
    } catch (error) {
      console.error("Failed to verify auth token", error);
      return NextResponse.json(
        { error: "Invalid or expired session. Please sign in again." },
        { status: 401 },
      );
    }

    const payload = parsedBody.data;
    const bridgeId = randomUUID();
    const apiKey = randomBytes(32).toString("hex");
    const rtspUrl = buildRtspUrl(payload);
    const backendUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const agentDownloadUrl =
      process.env.NEXT_PUBLIC_WINDOWS_AGENT_URL ||
      "https://myapp.com/downloads/difae-windows-agent.exe";

    try {
      await admin.firestore().collection("bridges").doc(bridgeId).set({
        id: bridgeId,
        userId,
        cameraId: null,
        rtspUrl,
        host: payload.host,
        port: payload.port,
        username: payload.username,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "pending",
        apiKey,
        backendUrl,
      });
    } catch (error) {
      console.error("Failed to create bridge document", error);
      return NextResponse.json(
        {
          error: "We couldn’t create the bridge. Please check your camera details and try again.",
        },
        { status: 500 },
      );
    }

    const configUrl = `/bridge-configs/${bridgeId}`;

    return NextResponse.json({
      bridgeId,
      apiKey,
      rtspUrl,
      agentDownloadUrl,
      configDownloadUrl: configUrl,
      config: {
        bridgeId,
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
