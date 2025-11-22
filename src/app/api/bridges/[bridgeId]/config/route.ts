import { NextRequest } from "next/server";
import { createBridgeConfigResponse } from "@/lib/bridge-config-response";

export async function GET(req: NextRequest, { params }: { params: { bridgeId?: string } }) {
  return createBridgeConfigResponse(req, params.bridgeId);
}
