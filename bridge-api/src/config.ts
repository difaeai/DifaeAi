import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFromFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const contents = readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || process.env[key] !== undefined) continue;
    const value = trimmed.slice(eqIndex + 1).trim();
    process.env[key] = value;
  }
}

const envFiles = [".env.local", ".env"];
const searchRoots = [process.cwd(), resolve(process.cwd(), "..")];

for (const root of searchRoots) {
  for (const file of envFiles) {
    loadEnvFromFile(resolve(root, file));
  }
}

export const APP_PORT = Number(process.env.BRIDGE_API_PORT ?? 8088);
export const APP_HOST = process.env.BRIDGE_API_HOST ?? "0.0.0.0";
export const MEDIA_HOST = process.env.MEDIA_HOST ?? "localhost";
export const HLS_BASE_URL = process.env.HLS_BASE_URL ?? `http://${MEDIA_HOST}:8080`;
export const JANUS_WS_URL = process.env.JANUS_WS_URL ?? `ws://${MEDIA_HOST}:8188`;
function loadKey(value?: string, base64?: string, pathVar?: string) {
  if (value && value.length > 0) return value;
  if (base64 && base64.length > 0) {
    return Buffer.from(base64, "base64").toString("utf8");
  }
  if (pathVar && existsSync(pathVar)) {
    return readFileSync(pathVar, "utf8");
  }
  return "";
}

export const JWT_PRIVATE_KEY = loadKey(
  process.env.JWT_PRIVATE_KEY,
  process.env.JWT_PRIVATE_KEY_B64,
  process.env.JWT_PRIVATE_KEY_PATH,
);
export const JWT_PUBLIC_KEY = loadKey(
  process.env.JWT_PUBLIC_KEY,
  process.env.JWT_PUBLIC_KEY_B64,
  process.env.JWT_PUBLIC_KEY_PATH,
);
export const JWT_ISSUER = process.env.JWT_ISSUER ?? "camera-bridge";
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? "camera-bridge-clients";
export const TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS ?? 300);
export const INGEST_WORKER_URL =
  process.env.INGEST_WORKER_URL ?? "http://ingest-worker:7000";
export const OBSERVE_WEBHOOK_URL = process.env.OBSERVE_WEBHOOK_URL ?? "";
