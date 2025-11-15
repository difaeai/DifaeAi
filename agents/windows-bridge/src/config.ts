import fs from "node:fs/promises";
import path from "node:path";

export interface AgentConfig {
  bridgeId: string;
  rtspUrl: string;
  backendUrl: string;
}

function sanitizePath(input: string | undefined): string | undefined {
  if (!input) return undefined;
  return input.trim();
}

export async function loadConfig(customPath?: string): Promise<AgentConfig> {
  const resolvedPath = customPath || path.join(process.cwd(), "config.json");

  let fileConfig: Partial<AgentConfig> = {};
  try {
    const raw = await fs.readFile(resolvedPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AgentConfig>;
    fileConfig = parsed;
  } catch (error) {
    throw new Error(
      `Unable to read config.json at ${resolvedPath}. Ensure the generated archive is extracted with the config file intact. (${error instanceof Error ? error.message : error})`,
    );
  }

  const envBridgeId = sanitizePath(process.env.BRIDGE_ID);
  const envRtspUrl = sanitizePath(process.env.RTSP_URL);
  const envBackendUrl = sanitizePath(process.env.BACKEND_URL);

  const merged: AgentConfig = {
    bridgeId: envBridgeId || sanitizePath(fileConfig.bridgeId) || "",
    rtspUrl: envRtspUrl || sanitizePath(fileConfig.rtspUrl) || "",
    backendUrl:
      envBackendUrl ||
      sanitizePath(fileConfig.backendUrl) ||
      "https://bridge.difae.ai",
  };

  if (!merged.bridgeId) {
    throw new Error(
      "bridgeId is missing from config.json and BRIDGE_ID environment variable.",
    );
  }

  if (!merged.rtspUrl) {
    throw new Error(
      "rtspUrl is missing from config.json and RTSP_URL environment variable.",
    );
  }

  if (!merged.backendUrl) {
    throw new Error(
      "backendUrl is missing from config.json and BACKEND_URL environment variable.",
    );
  }

  return merged;
}
