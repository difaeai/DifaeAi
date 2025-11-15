import { setInterval as createInterval, clearInterval } from "node:timers";
import type { AgentLogger } from "./logger";

export interface StreamingSession {
  completion: Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Placeholder streaming implementation that keeps the process alive and logs periodic heartbeats.
 *
 * TODO: Replace this stub with real FFmpeg/WebRTC streaming logic that forwards the RTSP stream
 * to the Difae ingest bridge.
 */
export async function startStreaming(
  rtspUrl: string,
  bridgeId: string,
  logger: AgentLogger,
): Promise<StreamingSession> {
  logger.info(`Starting placeholder streaming pipeline for bridge ${bridgeId}`);
  logger.info(`RTSP source: ${rtspUrl}`);

  let stopped = false;
  let resolveCompletion: (() => void) | undefined;

  const completion = new Promise<void>((resolve) => {
    resolveCompletion = resolve;
  });

  const heartbeat = createInterval(() => {
    if (!stopped) {
      logger.info(
        "Streaming heartbeat – awaiting real video pipeline integration.",
      );
    }
  }, 30_000);

  return {
    completion,
    async stop() {
      if (stopped) return;
      stopped = true;
      clearInterval(heartbeat);
      resolveCompletion?.();
      logger.info("Streaming pipeline stopped.");
    },
  };
}
