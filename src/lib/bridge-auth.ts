import { getBridgeStore } from "@/lib/bridge-store";
import { NextRequest } from "next/server";

export interface BridgeAuthSuccess {
  bridgeId: string;
  apiKey: string;
  userId?: string;
}

export async function validateBridgeCredentials(
  req: NextRequest,
): Promise<BridgeAuthSuccess | { error: string; status: number }> {
  const bridgeId = req.headers.get("x-bridge-id") || req.headers.get("x-bridge") || undefined;
  const apiKey =
    req.headers.get("x-bridge-apikey") ||
    req.headers.get("x-bridge-key") ||
    req.headers.get("x-api-key") ||
    undefined;

  if (!bridgeId || !apiKey) {
    return { error: "Missing bridge credentials", status: 403 };
  }

  const store = await getBridgeStore();
  const record = await store.get(bridgeId);

  if (!record || record.apiKey !== apiKey) {
    return { error: "Invalid bridge credentials", status: 403 };
  }

  return { bridgeId: record.id, apiKey: record.apiKey, userId: record.userId };
}

export async function validateBridgeApiKey(
  bridgeId: string,
  req: NextRequest,
) {
  const provided =
    req.headers.get("x-bridge-apikey") ||
    req.headers.get("x-bridge-key") ||
    req.headers.get("x-api-key") ||
    undefined;

  if (!provided) {
    return { error: "Missing bridge credentials", status: 401 as const };
  }

  const store = await getBridgeStore();
  const record = await store.get(bridgeId);

  if (!record || record.apiKey !== provided) {
    return { error: "Invalid bridge credentials", status: 401 as const };
  }

  return record;
}
