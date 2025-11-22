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

    const payload = parsedBody.data;
    const bridgeId = randomUUID();
    const bridgeSecret = randomBytes(32).toString("hex");
    const rtspUrl = buildRtspUrl(payload);
    const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    try {
      await admin.firestore().collection("bridges").doc(bridgeId).set({
        id: bridgeId,
        rtspUrl,
        host: payload.host,
        port: payload.port,
        username: payload.username,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "pending",
        secret: bridgeSecret,
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

    return NextResponse.json({
      bridgeId,
      bridgeSecret,
      rtspUrl,
      agentDownloadUrl: "/agents/difae-bridge-windows.exe",
      config: {
        bridgeId,
        bridgeSecret,
        rtspUrl,
        apiBaseUrl,
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
