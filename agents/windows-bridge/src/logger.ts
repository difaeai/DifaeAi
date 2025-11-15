import fs from "node:fs/promises";
import path from "node:path";

export interface AgentLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
}

async function append(logFile: string, level: string, message: string) {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`;
  try {
    await fs.appendFile(logFile, line, "utf8");
  } catch (error) {
    // eslint-disable-next-line no-console -- fallback logging when disk writes fail
    console.error("Failed to write log entry", error);
  }
}

export function createLogger(
  logDirectory = path.join(process.cwd(), "logs"),
): AgentLogger {
  const logFile = path.join(logDirectory, "bridge.log");
  void fs.mkdir(logDirectory, { recursive: true }).catch((error) => {
    // eslint-disable-next-line no-console -- fallback logging when disk writes fail
    console.error("Failed to create log directory", error);
  });

  return {
    info(message: string) {
      void append(logFile, "info", message);
    },
    warn(message: string) {
      void append(logFile, "warn", message);
    },
    error(message: string, error?: unknown) {
      const detail =
        error instanceof Error
          ? `${message} - ${error.message}`
          : error
            ? `${message} - ${String(error)}`
            : message;
      void append(logFile, "error", detail);
    },
  };
}
