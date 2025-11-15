import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import { z } from "zod";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

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

async function runZipCommand(
  tempDir: string,
  archiveName: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const zipProcess = spawn(
      "zip",
      ["-j", archiveName, "difae-bridge.exe", "config.json"],
      {
        cwd: tempDir,
      },
    );

    const errorChunks: string[] = [];

    zipProcess.stderr.on("data", (chunk) => {
      errorChunks.push(Buffer.from(chunk).toString());
    });

    zipProcess.on("error", (error) => {
      reject(error);
    });

    zipProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `zip command exited with code ${code}: ${errorChunks.join("\n")}`,
          ),
        );
      }
    });
  });
}

export async function POST(req: NextRequest) {
  let tempDir: string | null = null;
  let agentDocRef: admin.firestore.DocumentReference | null = null;

  try {
    await initFirebaseAdmin();

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
    const now = admin.firestore.FieldValue.serverTimestamp();

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
        createdAt: now,
      },
      { merge: true },
    );

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
    const configPath = path.join(tempDir, "config.json");
    const executableDestination = path.join(tempDir, "difae-bridge.exe");

    const backendUrl =
      process.env.DIFAE_BRIDGE_BACKEND_URL || DEFAULT_BACKEND_URL;

    const config = {
      bridgeId,
      rtspUrl,
      backendUrl,
    };

    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
    await fs.copyFile(sourceExecutable, executableDestination);

    const archiveName = `difae-bridge-${bridgeId}.zip`;
    const archivePath = path.join(tempDir, archiveName);

    try {
      await runZipCommand(tempDir, archiveName);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return NextResponse.json(
          {
            error:
              "zip command is not available on the server. Install the zip utility to enable agent packaging.",
          },
          { status: 500 },
        );
      }

      throw error;
    }

    const bucketName =
      process.env.WINDOWS_AGENT_BUCKET ||
      process.env.FIREBASE_STORAGE_BUCKET ||
      undefined;

    const bucket = admin.storage().bucket(bucketName);

    const storagePath = `windows-agents/${payload.userId}/${bridgeId}/${archiveName}`;

    await bucket.upload(archivePath, {
      destination: storagePath,
      contentType: "application/zip",
      metadata: {
        cacheControl: "private, max-age=0, no-transform",
      },
    });

    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const [signedUrl] = await bucket.file(storagePath).getSignedUrl({
      action: "read",
      expires,
    });

    await agentDocRef.set(
      {
        status: "ready",
        storagePath,
        downloadUrl: signedUrl,
        updatedAt: now,
      },
      { merge: true },
    );

    return NextResponse.json({ downloadUrl: signedUrl });
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

    return NextResponse.json(
      {
        error: "Failed to generate Windows agent.",
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
