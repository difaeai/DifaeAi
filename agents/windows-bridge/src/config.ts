import fs from "node:fs/promises";
import path from "node:path";

const EMBED_MARKER_TEXT = "DIFAE_CONFIG_V1";
const EMBED_MARKER_BUFFER = Buffer.from(EMBED_MARKER_TEXT, "utf8");

export interface AgentConfig {
  bridgeId: string;
  rtspUrl: string;
  backendUrl: string;
}

function sanitizePath(input: string | undefined): string | undefined {
  if (!input) return undefined;
  return input.trim();
}

async function readEmbeddedConfig(): Promise<Partial<AgentConfig>> {
  try {
    const executablePath = process.execPath;
    const exeBuffer = await fs.readFile(executablePath);

    const markerIndex = exeBuffer.lastIndexOf(EMBED_MARKER_BUFFER);
    if (markerIndex === -1) {
      return {};
    }

    const lengthStart = markerIndex + EMBED_MARKER_BUFFER.length;
    if (lengthStart + 4 > exeBuffer.length) {
      return {};
    }

    const payloadLength = exeBuffer.readUInt32LE(lengthStart);
    const configStart = lengthStart + 4;
    const configEnd = configStart + payloadLength;

    if (payloadLength < 2 || configEnd > exeBuffer.length) {
      return {};
    }

    const configSlice = exeBuffer.subarray(configStart, configEnd);
    const parsed = JSON.parse(configSlice.toString("utf8")) as Partial<AgentConfig>;
    return parsed;
  } catch (error) {
    console.warn(
      `Failed to read embedded agent configuration: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {};
  }
}

export async function loadConfig(customPath?: string): Promise<AgentConfig> {
  const resolvedPath = customPath || path.join(process.cwd(), "config.json");

  let fileConfig: Partial<AgentConfig> = {};
  try {
    const raw = await fs.readFile(resolvedPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AgentConfig>;
    fileConfig = parsed;
  } catch {
    fileConfig = {};
  }

  const embeddedConfig = customPath ? {} : await readEmbeddedConfig();

  const envBridgeId = sanitizePath(process.env.BRIDGE_ID);
  const envRtspUrl = sanitizePath(process.env.RTSP_URL);
  const envBackendUrl = sanitizePath(process.env.BACKEND_URL);

  const merged: AgentConfig = {
    bridgeId:
      envBridgeId ||
      sanitizePath(fileConfig.bridgeId) ||
      sanitizePath(embeddedConfig.bridgeId) ||
      "",
    rtspUrl:
      envRtspUrl ||
      sanitizePath(fileConfig.rtspUrl) ||
      sanitizePath(embeddedConfig.rtspUrl) ||
      "",
    backendUrl:
      envBackendUrl ||
      sanitizePath(fileConfig.backendUrl) ||
      sanitizePath(embeddedConfig.backendUrl) ||
      "https://bridge.difae.ai",
  };

  if (!merged.bridgeId) {
    throw new Error(
      "bridgeId is missing from the embedded config, config.json and BRIDGE_ID environment variable.",
    );
  }

  if (!merged.rtspUrl) {
    throw new Error(
      "rtspUrl is missing from the embedded config, config.json and RTSP_URL environment variable.",
    );
  }

  if (!merged.backendUrl) {
    throw new Error(
      "backendUrl is missing from the embedded config, config.json and BACKEND_URL environment variable.",
    );
  }

  return merged;
}
