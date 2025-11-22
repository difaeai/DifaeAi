import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import * as admin from "firebase-admin";
import { initFirebaseAdmin } from "@/lib/firebase-admin";

export interface BridgeRecord {
  id: string;
  userId: string;
  cameraId: string;
  rtspUrl: string;
  apiKey: string;
  backendUrl: string;
  createdAt: string;
  updatedAt: string;
  status?: "pending" | "online" | "offline";
}

interface BridgeStore {
  create(record: Omit<BridgeRecord, "createdAt" | "updatedAt">): Promise<BridgeRecord>;
  get(id: string): Promise<BridgeRecord | null>;
  update(id: string, data: Partial<BridgeRecord>): Promise<void>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const BRIDGES_FILE = path.join(DATA_DIR, "bridges.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

class FileBridgeStore implements BridgeStore {
  async create(record: Omit<BridgeRecord, "createdAt" | "updatedAt">): Promise<BridgeRecord> {
    const now = new Date().toISOString();
    const full: BridgeRecord = { ...record, createdAt: now, updatedAt: now };
    await ensureDataDir();
    const existing = await this.readAll();
    existing[full.id] = full;
    await fs.writeFile(BRIDGES_FILE, JSON.stringify(existing, null, 2), "utf8");
    return full;
  }

  async get(id: string): Promise<BridgeRecord | null> {
    const existing = await this.readAll();
    return existing[id] ?? null;
  }

  async update(id: string, data: Partial<BridgeRecord>): Promise<void> {
    const existing = await this.readAll();
    const current = existing[id];
    if (!current) return;
    const now = new Date().toISOString();
    existing[id] = { ...current, ...data, updatedAt: now };
    await ensureDataDir();
    await fs.writeFile(BRIDGES_FILE, JSON.stringify(existing, null, 2), "utf8");
  }

  private async readAll(): Promise<Record<string, BridgeRecord>> {
    try {
      const raw = await fs.readFile(BRIDGES_FILE, "utf8");
      return JSON.parse(raw) as Record<string, BridgeRecord>;
    } catch (error) {
      return {};
    }
  }
}

class FirestoreBridgeStore implements BridgeStore {
  private collection() {
    return admin.firestore().collection("bridges");
  }

  async create(record: Omit<BridgeRecord, "createdAt" | "updatedAt">): Promise<BridgeRecord> {
    const now = admin.firestore.FieldValue.serverTimestamp();
    const doc = {
      ...record,
      createdAt: now,
      updatedAt: now,
    };
    await this.collection().doc(record.id).set(doc);
    return {
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async get(id: string): Promise<BridgeRecord | null> {
    const snapshot = await this.collection().doc(id).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data();
    return data as BridgeRecord;
  }

  async update(id: string, data: Partial<BridgeRecord>): Promise<void> {
    await this.collection().doc(id).set(
      { ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );
  }
}

let storePromise: Promise<BridgeStore> | null = null;

async function selectStore(): Promise<BridgeStore> {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    await initFirebaseAdmin();
    return new FirestoreBridgeStore();
  }
  return new FileBridgeStore();
}

export async function getBridgeStore(): Promise<BridgeStore> {
  if (!storePromise) {
    storePromise = selectStore();
  }
  return storePromise;
}

export function buildBridgeRecord(params: {
  userId: string;
  rtspUrl: string;
  apiKey: string;
  backendUrl: string;
  cameraId?: string;
  bridgeId?: string;
}): Omit<BridgeRecord, "createdAt" | "updatedAt"> {
  const id = params.bridgeId ?? randomUUID();
  const cameraId = params.cameraId ?? `${id}-camera`;
  return {
    id,
    userId: params.userId,
    cameraId,
    rtspUrl: params.rtspUrl,
    apiKey: params.apiKey,
    backendUrl: params.backendUrl,
    status: "pending",
  };
}
