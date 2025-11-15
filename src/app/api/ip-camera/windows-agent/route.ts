import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { z } from "zod";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { registerAgentDownload } from "./store";
import { maybeSignExecutable, SigningConfigurationError } from "./signing";

const payloadSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  cameraId: z.string().min(1).optional(),
  cameraName: z.string().optional(),
  ipAddress: z.string().min(1, "ipAddress is required"),
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
  rtspPort: z.coerce.number().int().min(1).max(65535).default(554),
  rtspPath: z
    .string()
    .min(1, "rtspPath is required")
    .transform((value) => (value.startsWith("/") ? value : `/${value}`)),
});

const DEFAULT_BACKEND_URL = "https://bridge.difae.ai";
const EMBED_MARKER_TEXT = "DIFAE_CONFIG_V1";
const EMBED_MARKER_BUFFER = Buffer.from(EMBED_MARKER_TEXT, "utf8");

function buildEmbeddedConfig(config: Record<string, unknown>): Buffer {
  const configJson = JSON.stringify(config);
  const configBuffer = Buffer.from(configJson, "utf8");
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(configBuffer.length, 0);
  return Buffer.concat([EMBED_MARKER_BUFFER, lengthBuffer, configBuffer]);
}

export async function POST(req: NextRequest) {
  let tempDir: string | null = null;
  let agentDocRef: admin.firestore.DocumentReference | null = null;
  const hasFirebaseConfig = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  try {
    if (hasFirebaseConfig) {
      await initFirebaseAdmin();
    }

    const parsed = payloadSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues.map((issue) => issue.message).join(", "),
        },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    const rtspUrl = `rtsp://${encodeURIComponent(payload.username)}:${encodeURIComponent(payload.password)}@${payload.ipAddress}:${payload.rtspPort}${payload.rtspPath}`;

    const bridgeId = randomUUID();

    if (hasFirebaseConfig) {
      agentDocRef = admin
        .firestore()
        .collection("cameraBridgeAgents")
        .doc(bridgeId);

      await agentDocRef.set(
        {
          bridgeId,
          userId: payload.userId,
          cameraId: payload.cameraId ?? null,
          cameraName: payload.cameraName ?? null,
          rtspUrl,
          status: "pending",
          agentType: "windows-ip-camera",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    const agentTemplateDir =
      process.env.WINDOWS_AGENT_TEMPLATE_PATH ??
      path.join(process.cwd(), "agents", "windows-bridge", "dist");
    const sourceExecutable = path.join(agentTemplateDir, "difae-bridge.exe");

    try {
      await fs.access(sourceExecutable);
    } catch {
      return NextResponse.json(
        {
          error:
            "Windows agent template executable is missing. Build the agent and place difae-bridge.exe in agents/windows-bridge/dist.",
        },
        { status: 500 },
      );
    }

    tempDir = await fs.mkdtemp(path.join(tmpdir(), "difae-agent-"));
    const executableDestination = path.join(tempDir, "difae-bridge.exe");

    const backendUrl =
      process.env.DIFAE_BRIDGE_BACKEND_URL || DEFAULT_BACKEND_URL;

    const config = {
      bridgeId,
      rtspUrl,
      backendUrl,
    };

    await fs.copyFile(sourceExecutable, executableDestination);
    await fs.appendFile(executableDestination, buildEmbeddedConfig(config));

    await maybeSignExecutable(executableDestination);

    const agentFileName = `difae-bridge-${bridgeId}.exe`;

    const bucketName =
      process.env.WINDOWS_AGENT_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "";
    const canUseBucket = hasFirebaseConfig && bucketName.length > 0;

    if (canUseBucket) {
      const bucket = admin.storage().bucket(bucketName);
      const storagePath = `windows-agents/${payload.userId}/${bridgeId}/${agentFileName}`;

      await bucket.upload(executableDestination, {
        destination: storagePath,
        contentType: "application/octet-stream",
        metadata: {
          cacheControl: "private, max-age=0, no-transform",
          contentDisposition: `attachment; filename="${agentFileName}"`,
        },
      });

      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
      const [signedUrl] = await bucket.file(storagePath).getSignedUrl({
        action: "read",
        expires,
      });

      if (agentDocRef) {
        await agentDocRef.set(
          {
            status: "ready",
            storagePath,
            downloadUrl: signedUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      return NextResponse.json({ downloadUrl: signedUrl });
    }

    const { downloadUrl, record } = await registerAgentDownload(
      executableDestination,
      agentFileName,
    );

    if (agentDocRef) {
      await agentDocRef.set(
        {
          status: "ready",
          downloadUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    return NextResponse.json({ downloadUrl, expiresAt: record.expiresAt });
  } catch (error) {
    console.error("windows-agent generation failed", error);

    if (agentDocRef) {
      await agentDocRef.set(
        {
          status: "failed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    const message =
      error instanceof SigningConfigurationError
        ? error.message
        : "Failed to generate Windows agent.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  } finally {
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn("Failed to clean up temp directory", cleanupError);
      }
    }
  }
}
