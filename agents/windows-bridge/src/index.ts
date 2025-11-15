import { Service } from "node-windows";
import { loadConfig } from "./config";
import { createLogger } from "./logger";
import { runAgentRuntime } from "./runtime";

async function ensureServiceInstalled(): Promise<void> {
  const config = await loadConfig();
  const logger = createLogger();
  const args = new Set(process.argv.slice(2));

  if (args.has("--foreground") || args.has("--run-service")) {
    logger.info("Running in foreground/service mode");
    await runAgentRuntime(config, logger);
    return;
  }

  const serviceName = `DifaeBridge_${config.bridgeId}`;
  const svc = new Service({
    name: serviceName,
    description: "Difae IP Camera Windows Bridge",
    script: process.execPath,
    args: ["--run-service"],
    wait: 2,
    grow: 0.25,
    maxRetries: 5,
    workingDirectory: process.cwd(),
    env: [
      { name: "BRIDGE_ID", value: config.bridgeId },
      { name: "RTSP_URL", value: config.rtspUrl },
      { name: "BACKEND_URL", value: config.backendUrl },
    ],
  });

  logger.info(`Ensuring Windows service ${serviceName} is installed.`);

  await new Promise<void>((resolve, reject) => {
    let resolved = false;

    const finish = (error?: Error) => {
      if (resolved) return;
      resolved = true;
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const startService = () => {
      try {
        svc.start();
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
        return;
      }

      // Resolve once the service reports as started or after a short delay.
      svc.on("start", () => {
        logger.info(`Windows service ${serviceName} started.`);
        finish();
      });

      setTimeout(() => {
        logger.info(`Continuing after attempting to start ${serviceName}.`);
        finish();
      }, 3_000);
    };

    svc.on("install", () => {
      logger.info(`Windows service ${serviceName} installed.`);
      startService();
    });

    svc.on("alreadyinstalled", () => {
      logger.info(`Windows service ${serviceName} already installed.`);
      startService();
    });

    svc.on("invalidinstallation", () => {
      finish(new Error(`Installation for ${serviceName} is invalid.`));
    });

    svc.on("error", (error) => {
      finish(error instanceof Error ? error : new Error(String(error)));
    });

    svc.install();
  });

  logger.info(
    `Service ${serviceName} installation completed. The agent will continue running as a background service after this launcher exits.`,
  );
}

void ensureServiceInstalled().catch((error) => {
  // eslint-disable-next-line no-console -- last resort logging path before config/logs are available
  console.error("Failed to prepare Windows agent", error);
  process.exitCode = 1;
});
