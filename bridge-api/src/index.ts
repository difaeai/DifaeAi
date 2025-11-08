import Fastify from "fastify";
import sensible from "@fastify/sensible";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import pino from "pino";
import fastifyJwt from "@fastify/jwt";
import type { SignOptions } from "@fastify/jwt";
import {
  APP_HOST,
  APP_PORT,
  JWT_PUBLIC_KEY,
  JWT_PRIVATE_KEY,
  JWT_ISSUER,
  JWT_AUDIENCE,
} from "./config";
import { devicesRoutes } from "./routes/devices";
import { discoveryRoutes } from "./routes/discovery";
import { streamRoutes } from "./routes/streams";
import { healthRoutes } from "./routes/health";
import { deviceStore } from "./store";
import { ingestClient } from "./services/ingest-client";

const logger = pino({ name: "bridge-api" });

async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(sensible);
  await app.register(cors, {
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  });

  await app.register(swagger, {
    openapi: {
      info: { title: "Universal Camera Bridge API", version: "0.1.0" },
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  if (JWT_PUBLIC_KEY) {
    const signOptions = {
      algorithm: "RS256" as const,
      ...(JWT_ISSUER ? { issuer: JWT_ISSUER } : {}),
      ...(JWT_AUDIENCE ? { audience: JWT_AUDIENCE } : {}),
    } satisfies Partial<SignOptions>;

    await app.register(fastifyJwt, {
      secret: {
        private: JWT_PRIVATE_KEY,
        public: JWT_PUBLIC_KEY,
      },
      sign: signOptions,
    });
  } else {
    logger.warn("JWT public key not configured; token verification disabled");
  }

  await app.register(devicesRoutes);
  await app.register(discoveryRoutes);
  await app.register(streamRoutes);
  await app.register(healthRoutes);

  app.post("/webhooks/device-offline", async (request, reply) => {
    const payload = request.body as { deviceId: string; error?: string };
    if (!payload?.deviceId) {
      return reply.badRequest("deviceId required");
    }

    const device = deviceStore.get(payload.deviceId);
    if (device) {
      deviceStore.updateStatus(payload.deviceId, {
        ingestState: "error",
        lastError: payload.error ?? "ingest heartbeat missed",
      });
      logger.warn({ deviceId: payload.deviceId }, "device marked offline");
    }

    return reply.send({ ok: true });
  });

  app.setErrorHandler((error, request, reply) => {
    logger.error({ err: error, url: request.url }, "unhandled error");
    reply.status(500).send({ error: "Internal Server Error" });
  });

  app.addHook("onClose", async () => {
    for (const device of deviceStore.list()) {
      if (device.status.ingestState === "running") {
        await ingestClient.stop(device.id).catch((err) => {
          logger.error({ err, deviceId: device.id }, "failed to stop ingest on shutdown");
        });
      }
    }
  });

  return app;
}

async function start() {
  const server = await buildServer();
  try {
    await server.listen({ host: APP_HOST, port: APP_PORT });
    logger.info({ port: APP_PORT }, "bridge-api listening");
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export { buildServer };
