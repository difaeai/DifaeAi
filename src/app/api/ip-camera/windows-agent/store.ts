import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";

export interface StoredAgentRecord {
  token: string;
  filePath: string;
  fileName: string;
  contentType: string;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 1000 * 60 * 60; // 1 hour
const DOWNLOAD_DIR = path.join(tmpdir(), "difae-windows-agents");

type AgentStore = Map<string, StoredAgentRecord>;

declare global {
  // eslint-disable-next-line no-var
  var __difaeWindowsAgentStore: AgentStore | undefined;
}

const globalStore = globalThis.__difaeWindowsAgentStore ?? new Map<string, StoredAgentRecord>();
if (!globalThis.__difaeWindowsAgentStore) {
  globalThis.__difaeWindowsAgentStore = globalStore;
}

async function removeFileSafe(filePath: string) {
  try {
    await fs.rm(filePath, { force: true });
  } catch {
    // ignore removal errors
  }
}

export async function cleanupExpiredAgents() {
  const now = Date.now();
  for (const [token, record] of globalStore.entries()) {
    if (record.expiresAt <= now) {
      globalStore.delete(token);
      await removeFileSafe(record.filePath);
    }
  }
}

export async function registerAgentDownload(
  sourcePath: string,
  fileName: string,
  options?: { contentType?: string; expiresInMs?: number },
) {
  await cleanupExpiredAgents();

  const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_") || "difae-bridge.exe";
  const token = randomUUID();
  const extension = path.extname(safeName) || ".exe";
  const targetName = `${token}${extension}`;

  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
  const targetPath = path.join(DOWNLOAD_DIR, targetName);
  await fs.copyFile(sourcePath, targetPath);

  const record: StoredAgentRecord = {
    token,
    filePath: targetPath,
    fileName: safeName,
    contentType: options?.contentType ?? "application/vnd.microsoft.portable-executable",
    expiresAt: Date.now() + (options?.expiresInMs ?? DEFAULT_TTL_MS),
  };

  globalStore.set(token, record);

  return {
    token,
    record,
    downloadUrl: `/api/ip-camera/windows-agent/download/${token}`,
  };
}

export async function getAgentByToken(token: string) {
  await cleanupExpiredAgents();
  const record = globalStore.get(token);
  if (!record) {
    return null;
  }

  try {
    await fs.access(record.filePath);
  } catch {
    globalStore.delete(token);
    return null;
  }

  return record;
}

export async function revokeAgent(token: string) {
  const record = globalStore.get(token);
  if (!record) {
    return;
  }
  globalStore.delete(token);
  await removeFileSafe(record.filePath);
}
