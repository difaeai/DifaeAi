import { setTimeout as delay } from "node:timers/promises";
import type { AgentConfig } from "./config";
import type { AgentLogger } from "./logger";
import { startStreaming } from "./streaming";

function normaliseBackendUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

async function notifyBackend(config: AgentConfig, logger: AgentLogger) {
  const endpoint = `${normaliseBackendUrl(config.backendUrl)}/api/agent/heartbeat`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bridgeId: config.bridgeId, status: "online" }),
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn(`Backend heartbeat responded with HTTP ${response.status}.`);
    }
  } catch (error) {
    logger.warn(
      `Failed to notify backend about bridge ${config.bridgeId}. ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function runAgentRuntime(
  config: AgentConfig,
  logger: AgentLogger,
): Promise<void> {
  logger.info(`Launching Difae Windows bridge runtime for ${config.bridgeId}.`);

  let backoffMs = 1_000;
  const maxBackoffMs = 60_000;

  while (true) {
    try {
      await notifyBackend(config, logger);
      const session = await startStreaming(
        config.rtspUrl,
        config.bridgeId,
        logger,
      );
      logger.info("Streaming loop started. Waiting for completion signal.");
      await session.completion;
      logger.warn(
        "Streaming session completed unexpectedly. Restarting after backoff.",
      );
    } catch (error) {
      logger.error("Streaming loop crashed", error);
    }

    logger.info(`Retrying connection in ${backoffMs / 1000} seconds.`);
    await delay(backoffMs);
    backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
  }
}
