import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const pipelineAsync = promisify(pipeline);
const RELAY_STORAGE_DIR = path.join(process.cwd(), "storage", "bridge-relay");

export async function relayRoutes(app: FastifyInstance) {
  await mkdir(RELAY_STORAGE_DIR, { recursive: true });

  app.post("/api/bridge/relay", { logLevel: "info" }, async (request, reply) => {
    const bridgeId = (request.headers["x-bridge-id"] ?? request.query.bridgeId ?? "unknown") as string;
    const sessionId = randomUUID();
    const log = request.log.child({ bridgeId, sessionId });

    const fileName = `${bridgeId}-${sessionId}-${Date.now()}.ts`;
    const targetPath = path.join(RELAY_STORAGE_DIR, fileName);
    const writeStream = createWriteStream(targetPath);

    reply.raw.writeHead(200, {
      "Content-Type": "text/plain",
      Connection: "keep-alive",
    });
    reply.raw.write("relay-ok\n");

    try {
      await pipelineAsync(request.raw, writeStream);
      log.info({ targetPath }, "relay stream closed");
    } catch (error) {
      log.error({ err: error }, "relay pipeline failed");
      throw error;
    } finally {
      reply.raw.end();
    }

    return reply;
  });
}
