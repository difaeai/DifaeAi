import crypto from "node:crypto";
import {
  DeviceRecord,
  DeviceStatus,
  DeviceCredentials,
  CameraType,
  PublicDevice,
} from "./types";

type DeviceMap = Map<string, DeviceRecord>;

class DeviceStore {
  #devices: DeviceMap = new Map();

  list(): DeviceRecord[] {
    return Array.from(this.#devices.values());
  }

  get(id: string): DeviceRecord | undefined {
    return this.#devices.get(id);
  }

  create(input: {
    name: string;
    type: CameraType;
    vendor?: string;
    model?: string;
    siteId?: string;
    ip?: string;
    notes?: string;
    credentials: DeviceCredentials;
  }): DeviceRecord {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const record: DeviceRecord = {
      id,
      name: input.name,
      type: input.type,
      vendor: input.vendor,
      model: input.model,
      siteId: input.siteId,
      ip: input.ip,
      notes: input.notes,
      credentials: input.credentials,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: this.initialStatus(),
    };

    this.#devices.set(id, record);
    return record;
  }

  updateStatus(id: string, status: Partial<DeviceStatus>) {
    const existing = this.#devices.get(id);
    if (!existing) {
      throw new Error(`Device ${id} not found`);
    }
    existing.status = { ...existing.status, ...status };
    existing.updatedAt = new Date().toISOString();
    this.#devices.set(id, existing);
  }

  private initialStatus(): DeviceStatus {
    return {
      ingestState: "idle",
      fps: 0,
      bitrateKbps: 0,
      targets: [],
    };
  }
}

export const deviceStore = new DeviceStore();

export function toPublicDevice(record: DeviceRecord): PublicDevice {
  return {
    ...record,
    credentials: {
      username: record.credentials.username,
      rtspUrl: record.credentials.rtspUrl,
    },
  };
}
