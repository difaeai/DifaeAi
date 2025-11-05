import { IngestCommand } from "../types";
import { INGEST_WORKER_URL } from "../config";
import pino from "pino";

const logger = pino({ name: "ingest-client" });

async function request(path: string, init: RequestInit = {}) {
  const url = `${INGEST_WORKER_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const payload = await response.text();
    logger.error({ url, status: response.status, payload }, "ingest request failed");
    throw new Error(`Ingest worker responded with ${response.status}`);
  }
  return response.json();
}

export const ingestClient = {
  async start(command: IngestCommand) {
    return request("/ingest/start", { method: "POST", body: JSON.stringify(command) });
  },
  async stop(deviceId: string) {
    return request("/ingest/stop", { method: "POST", body: JSON.stringify({ deviceId }) });
  },
  async status(deviceId: string) {
    return request(`/ingest/status/${deviceId}`, { method: "GET" });
  },
};
