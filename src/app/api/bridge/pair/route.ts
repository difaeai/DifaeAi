import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBridgeStore } from "@/lib/bridge-store";

export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  pairCode: z.string().min(3),
  agentVersion: z.string().optional(),
  machineId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsedBody = payloadSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: "invalid_pair_code" }, { status: 400 });
    }

    const { pairCode, agentVersion, machineId } = parsedBody.data;

    const store = await getBridgeStore();
    const record = await store.findByPairCode(pairCode);

    const isExpired =
      record?.pairCodeExpiresAt && new Date(record.pairCodeExpiresAt).getTime() < Date.now();

    if (!record || record.paired || isExpired) {
      return NextResponse.json({ error: "invalid_pair_code" }, { status: 400 });
    }

    await store.update(record.id, {
      paired: true,
      pairCode: null,
      pairCodeExpiresAt: null,
    });

    const backendUrl =
      record.backendUrl ||
      process.env.NEXT_PUBLIC_BRIDGE_BACKEND_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin;

    const uploadBaseUrl = process.env.NEXT_PUBLIC_BRIDGE_UPLOAD_BASE_URL || backendUrl;

    console.info("Bridge paired via code", {
      bridgeId: record.id,
      machineId,
      agentVersion,
    });

    return NextResponse.json({
      bridgeId: record.id,
      apiKey: record.apiKey,
      rtspUrl: record.rtspUrl,
      backendUrl,
      uploadBaseUrl,
      pollIntervalMs: 5000,
    });
  } catch (error) {
    console.error("Failed to pair bridge", error);
    return NextResponse.json({ error: "pairing_failed" }, { status: 500 });
  }
}
