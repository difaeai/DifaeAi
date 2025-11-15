import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { z } from "zod";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import {
  WINDOWS_AGENT_ERROR_CODES,
  type WindowsAgentErrorCode,
} from "@/lib/windows-agent/errors";
import * as admin from "firebase-admin";
import { registerAgentDownload } from "./store";
import { extractArchive, createArchive } from "./archive";

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

interface ErrorResponse {
  message: string;
  code: WindowsAgentErrorCode;
}

interface ExtendedErrorOptions {
  cause?: unknown;
}

class WindowsAgentGenerationError extends Error {
  public readonly response: ErrorResponse;
  public readonly status: number;

  constructor(response: ErrorResponse, status = 500, options?: ExtendedErrorOptions) {
    super(response.message, options);
    this.response = response;
    this.status = status;
    this.name = "WindowsAgentGenerationError";
  }
}

function normaliseError(_error: unknown): ErrorResponse {
  return {
    message: "Failed to generate Windows agent.",
    code: WINDOWS_AGENT_ERROR_CODES.UNKNOWN_ERROR,
  };
}

export async function POST(req: NextRequest) {
  let tempDir: string | null = null;
  let agentDocRef: admin.firestore.DocumentReference | null = null;
  const hasFirebaseConfig = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  try {
    if (hasFirebaseConfig) {
      try {
        await initFirebaseAdmin();
      } catch (firebaseError) {
        throw new WindowsAgentGenerationError(
          {
            message: "Failed to initialise backend services for Windows agent generation.",
            code: WINDOWS_AGENT_ERROR_CODES.FIREBASE_INIT_FAILED,
          },
          500,
          { cause: firebaseError instanceof Error ? firebaseError : undefined },
        );
      }
    }

    const parsed = payloadSchema.safeParse(await req.json());

    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return NextResponse.json(
        {
          error: message,
          code: WINDOWS_AGENT_ERROR_CODES.VALIDATION_FAILED,
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

      try {
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
      } catch (error) {
        throw new WindowsAgentGenerationError(
          {
            message: "Failed to persist Windows agent state.",
            code: WINDOWS_AGENT_ERROR_CODES.FIRESTORE_WRITE_FAILED,
          },
          500,
          { cause: error instanceof Error ? error : undefined },
        );
      }
    }

    const templateZipPath =
      process.env.WINDOWS_AGENT_TEMPLATE_ZIP_PATH ??
      path.join(
        process.cwd(),
        "bridge",
        "windows-agent",
        "windows-agent-template.zip",
      );

    try {
      await fs.access(templateZipPath);
    } catch (error) {
      throw new WindowsAgentGenerationError(
        {
          message:
            "Windows agent template archive is missing. Run npm run build:windows-agent before generating downloads.",
          code: WINDOWS_AGENT_ERROR_CODES.TEMPLATE_MISSING,
        },
        500,
        { cause: error instanceof Error ? error : undefined },
      );
    }

    tempDir = await fs.mkdtemp(path.join(tmpdir(), "difae-agent-"));
    const extractDir = path.join(tempDir, "template");
    try {
      await extractArchive(templateZipPath, extractDir);
    } catch (error) {
      throw new WindowsAgentGenerationError(
        {
          message:
            "Failed to unpack the Windows agent template. Install zip/unzip (Linux/macOS) or ensure PowerShell is available (Windows).",
          code: WINDOWS_AGENT_ERROR_CODES.UNKNOWN_ERROR,
        },
        500,
        { cause: error instanceof Error ? error : undefined },
      );
    }

    const backendUrl =
      process.env.DIFAE_BRIDGE_BACKEND_URL || DEFAULT_BACKEND_URL;
    const relayEndpoint =
      process.env.DIFAE_BRIDGE_RELAY_ENDPOINT || "/api/bridge/relay";
    const apiKey = process.env.DIFAE_BRIDGE_AGENT_API_KEY ?? undefined;
    const ffmpegPath = process.env.DIFAE_BRIDGE_AGENT_FFMPEG_PATH || "ffmpeg";

    const config = {
      bridgeId,
      backendUrl,
      relayEndpoint,
      ...(apiKey ? { apiKey } : {}),
      camera: {
        host: payload.ipAddress,
        username: payload.username,
        password: payload.password,
        rtspPort: payload.rtspPort,
        streamPath: payload.rtspPath,
        rtspUrl,
      },
      ffmpeg: {
        path: ffmpegPath,
        rtspTransport: "tcp",
        extraArguments: ["-stimeout", "10000000"],
      },
    } satisfies Record<string, unknown>;

    const configPath = path.join(extractDir, "agent-config.json");
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");

    const packagedArchive = path.join(tempDir, `difae-bridge-${bridgeId}.zip`);
    try {
      await createArchive(extractDir, packagedArchive);
    } catch (error) {
      throw new WindowsAgentGenerationError(
        {
          message:
            "Failed to package the Windows agent archive. Install zip/unzip (Linux/macOS) or ensure PowerShell is available (Windows).",
          code: WINDOWS_AGENT_ERROR_CODES.UNKNOWN_ERROR,
        },
        500,
        { cause: error instanceof Error ? error : undefined },
      );
    }

    const agentFileName = `difae-bridge-${bridgeId}.zip`;

    const bucketName =
      process.env.WINDOWS_AGENT_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "";
    const canUseBucket = hasFirebaseConfig && bucketName.length > 0;

    if (canUseBucket) {
      const bucket = admin.storage().bucket(bucketName);
      const storagePath = `windows-agents/${payload.userId}/${bridgeId}/${agentFileName}`;

      try {
        await bucket.upload(packagedArchive, {
          destination: storagePath,
          contentType: "application/zip",
          metadata: {
            cacheControl: "private, max-age=0, no-transform",
            contentDisposition: `attachment; filename="${agentFileName}"`,
          },
        });
      } catch (error) {
        throw new WindowsAgentGenerationError(
          {
            message: "Failed to upload the Windows agent to Cloud Storage.",
            code: WINDOWS_AGENT_ERROR_CODES.STORAGE_UPLOAD_FAILED,
          },
          500,
          { cause: error instanceof Error ? error : undefined },
        );
      }

      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

      let signedUrl: string;
      try {
        [signedUrl] = await bucket.file(storagePath).getSignedUrl({
          action: "read",
          expires,
        });
      } catch (error) {
        throw new WindowsAgentGenerationError(
          {
            message: "Failed to create a download URL for the Windows agent.",
            code: WINDOWS_AGENT_ERROR_CODES.STORAGE_URL_GENERATION_FAILED,
          },
          500,
          { cause: error instanceof Error ? error : undefined },
        );
      }

      if (agentDocRef) {
        try {
          await agentDocRef.set(
            {
              status: "ready",
              storagePath,
              downloadUrl: signedUrl,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        } catch (firestoreError) {
          console.warn("failed to update agent record", firestoreError);
        }
      }

      return NextResponse.json({ downloadUrl: signedUrl });
    }

    let registration: Awaited<ReturnType<typeof registerAgentDownload>>;
    try {
      registration = await registerAgentDownload(
        packagedArchive,
        agentFileName,
        { contentType: "application/zip" },
      );
    } catch (error) {
      throw new WindowsAgentGenerationError(
        {
          message: "Failed to prepare the Windows agent download.",
          code: WINDOWS_AGENT_ERROR_CODES.DOWNLOAD_REGISTRATION_FAILED,
        },
        500,
        { cause: error instanceof Error ? error : undefined },
      );
    }

    const { downloadUrl, record } = registration;

    if (agentDocRef) {
      try {
        await agentDocRef.set(
          {
            status: "ready",
            downloadUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } catch (firestoreError) {
        console.warn("failed to update agent record", firestoreError);
      }
    }

    return NextResponse.json({ downloadUrl, expiresAt: record.expiresAt });
  } catch (error) {
    console.error("windows-agent generation failed", error);

    const response =
      error instanceof WindowsAgentGenerationError
        ? error.response
        : normaliseError(error);
    const status =
      error instanceof WindowsAgentGenerationError ? error.status : 500;

    if (agentDocRef) {
      try {
        await agentDocRef.set(
          {
            status: "failed",
            errorCode: response.code,
            errorMessage: response.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } catch (firestoreError) {
        console.warn("failed to update agent record", firestoreError);
      }
    }

    return NextResponse.json(
      {
        error: response.message,
        code: response.code,
      },
      { status },
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
