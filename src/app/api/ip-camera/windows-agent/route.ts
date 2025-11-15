import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
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

function msDosDateTime(date: Date): { date: number; time: number } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosDate =
    ((Math.max(1980, year) - 1980) << 9) |
    ((Math.max(1, Math.min(month, 12)) & 0x0f) << 5) |
    (Math.max(1, Math.min(day, 31)) & 0x1f);
  const dosTime =
    ((Math.max(0, Math.min(hours, 23)) & 0x1f) << 11) |
    ((Math.max(0, Math.min(minutes, 59)) & 0x3f) << 5) |
    (Math.max(0, Math.min(seconds, 29)) & 0x1f);

  return { date: dosDate, time: dosTime };
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;

  for (let i = 0; i < buffer.length; i += 1) {
    let byte = buffer[i];
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

async function createZipArchive(
  tempDir: string,
  archiveName: string,
): Promise<string> {
  const files = await Promise.all(
    ["difae-bridge.exe", "config.json"].map(async (name) => {
      const filePath = path.join(tempDir, name);
      const data = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);
      return { name, data, mtime: stats.mtime }; 
    }),
  );

  interface ZipRecord {
    nameBuffer: Buffer;
    data: Buffer;
    crc: number;
    modTime: number;
    modDate: number;
    offset: number;
    size: number;
  }

  const records: ZipRecord[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, "utf8");
    const { date: dosDate, time: dosTime } = msDosDateTime(file.mtime);
    const crc = crc32(file.data);
    const fileSize = file.data.length;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(file.data.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    records.push({
      nameBuffer,
      data: Buffer.concat([localHeader, nameBuffer, file.data]),
      crc,
      modDate: dosDate,
      modTime: dosTime,
      offset,
      size: fileSize,
    });

    offset += localHeader.length + nameBuffer.length + fileSize;
  }

  const centralDirectoryParts: Buffer[] = [];
  let centralDirectorySize = 0;

  for (const record of records) {
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(record.modTime, 12);
    header.writeUInt16LE(record.modDate, 14);
    header.writeUInt32LE(record.crc, 16);
    header.writeUInt32LE(record.size, 20);
    header.writeUInt32LE(record.size, 24);
    header.writeUInt16LE(record.nameBuffer.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(record.offset, 42);

    centralDirectoryParts.push(header, record.nameBuffer);
    centralDirectorySize += header.length + record.nameBuffer.length;
  }

  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(records.length, 8);
  endOfCentralDirectory.writeUInt16LE(records.length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectorySize, 12);
  endOfCentralDirectory.writeUInt32LE(offset, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);

  const archiveBuffer = Buffer.concat([
    ...records.map((record) => record.data),
    ...centralDirectoryParts,
    endOfCentralDirectory,
  ]);

  const archivePath = path.join(tempDir, archiveName);
  await fs.writeFile(archivePath, archiveBuffer);

  return archivePath;
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
    const archivePath = await createZipArchive(tempDir, archiveName);

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
