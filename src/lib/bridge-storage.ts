import { promises as fs } from "node:fs";
import path from "node:path";

const STORAGE_ROOT =
  process.env.BRIDGE_STORAGE_ROOT || path.join(process.cwd(), ".data", "bridges");

function bridgeDir(bridgeId: string) {
  return path.join(STORAGE_ROOT, bridgeId, "hls");
}

export async function saveManifest(bridgeId: string, data: Buffer | string) {
  const dir = bridgeDir(bridgeId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "out.m3u8"), data);
}

export async function saveSegment(
  bridgeId: string,
  fileName: string,
  data: Buffer,
) {
  const dir = bridgeDir(bridgeId);
  await fs.mkdir(dir, { recursive: true });
  const safeName = path.basename(fileName || `segment-${Date.now()}.ts`);
  await fs.writeFile(path.join(dir, safeName), data);
  return safeName;
}

export async function readManifest(bridgeId: string) {
  const dir = bridgeDir(bridgeId);
  return fs.readFile(path.join(dir, "out.m3u8"));
}

export async function readSegment(bridgeId: string, name: string) {
  const dir = bridgeDir(bridgeId);
  const safeName = path.basename(name);
  return fs.readFile(path.join(dir, safeName));
}

export function manifestPathForLogging(bridgeId: string) {
  return path.join(bridgeDir(bridgeId), "out.m3u8");
}
