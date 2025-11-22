import { NextRequest, NextResponse } from "next/server";
import formidable, { Fields, Files } from "formidable";
import fs from "fs/promises";
import path from "path";
import { Readable } from "node:stream";
import { getBridgeStore } from "@/lib/bridge-store";

export const dynamic = "force-dynamic";

async function validateBridge(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  const bridgeId = req.headers.get("x-bridge-id");
  if (!apiKey || !bridgeId) {
    return { error: "Missing credentials", status: 401 as const };
  }

  const store = await getBridgeStore();
  const record = await store.get(bridgeId);
  if (!record || record.apiKey !== apiKey) {
    return { error: "Invalid credentials", status: 401 as const };
  }

  return { record } as const;
}

export async function POST(req: NextRequest) {
  const auth = await validateBridge(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const form = formidable({ maxFileSize: 2 * 1024 * 1024 });
  const nodeStream: Readable | null = req.body ? Readable.fromWeb(req.body as any) : null;

  if (!nodeStream) {
    return NextResponse.json({ error: "Invalid form payload" }, { status: 400 });
  }

  const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
    form.parse(nodeStream, (err: unknown, fields: Fields, files: Files) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  }).catch((error) => {
    console.error("Failed to parse playlist upload", error);
    return [] as unknown as [Fields, Files];
  });

  if (!fields || !files) {
    return NextResponse.json({ error: "Invalid form payload" }, { status: 400 });
  }

  const cameraIdField = Array.isArray(fields.camera_id) ? fields.camera_id[0] : fields.camera_id;
  const bridgeIdField = Array.isArray(fields.bridge_id) ? fields.bridge_id[0] : fields.bridge_id;
  const fileArray = files.file;
  const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

  if (!cameraIdField || !bridgeIdField || !file) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (bridgeIdField !== auth.record.id) {
    return NextResponse.json({ error: "Bridge mismatch" }, { status: 403 });
  }

  const storageDir = path.join(process.cwd(), "storage", "streams", auth.record.id, String(cameraIdField));
  await fs.mkdir(storageDir, { recursive: true });

  const fileName = file.originalFilename || "playlist.m3u8";
  const destPath = path.join(storageDir, fileName);

  await fs.copyFile(file.filepath, destPath);
  await fs.unlink(file.filepath);

  await getBridgeStore().then((store) => store.update(auth.record.id, { status: "online" }));

  return NextResponse.json({ success: true, file: fileName });
}
