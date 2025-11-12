import type { FastifyInstance, FastifyRequest } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import pino from "pino";
import formidable from "formidable";
import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import { bridgeAuthStore } from "../services/bridge-auth";

const logger = pino({ name: "bridge-connection" });

interface BridgeConnection {
  bridgeId: string;
  bridgeName: string;
  ws: WebSocket;
  connectedAt: Date;
  lastPing: Date;
}

class BridgeRegistry {
  private bridges: Map<string, BridgeConnection> = new Map();

  register(bridgeId: string, bridgeName: string, ws: WebSocket) {
    const connection: BridgeConnection = {
      bridgeId,
      bridgeName,
      ws,
      connectedAt: new Date(),
      lastPing: new Date(),
    };
    this.bridges.set(bridgeId, connection);
    logger.info({ bridgeId, bridgeName }, "Bridge connected");
  }

  unregister(bridgeId: string) {
    this.bridges.delete(bridgeId);
    logger.info({ bridgeId }, "Bridge disconnected");
  }

  get(bridgeId: string): BridgeConnection | undefined {
    return this.bridges.get(bridgeId);
  }

  list(): BridgeConnection[] {
    return Array.from(this.bridges.values());
  }

  updatePing(bridgeId: string) {
    const bridge = this.bridges.get(bridgeId);
    if (bridge) {
      bridge.lastPing = new Date();
    }
  }
}

const bridgeRegistry = new BridgeRegistry();

export async function bridgeConnectionRoutes(app: FastifyInstance) {
  // WebSocket endpoint for bridge agents
  app.get("/bridge/ws", { websocket: true }, (socket, request) => {
    const bridgeId = request.headers["x-bridge-id"] as string;
    const apiKey = request.headers["x-api-key"] as string;

    if (!bridgeId || !apiKey) {
      socket.close(1008, "Missing bridge credentials");
      return;
    }

    // Auto-register bridge on first connection (for simplicity)
    // In production, require manual registration first
    if (!bridgeAuthStore.get(bridgeId)) {
      bridgeAuthStore.register(bridgeId, apiKey, "Auto-registered Bridge");
    }

    if (!bridgeAuthStore.validate(bridgeId, apiKey)) {
      socket.close(1008, "Invalid credentials");
      return;
    }

    logger.info({ bridgeId }, "Bridge authenticated and connecting");

    let bridgeName = "Unknown Bridge";

    socket.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const messageType = message.type;

        if (messageType === "register") {
          bridgeName = message.bridge_name || bridgeName;
          bridgeRegistry.register(bridgeId, bridgeName, socket);
          
          socket.send(JSON.stringify({
            type: "registered",
            bridge_id: bridgeId,
            message: "Successfully registered with BERRETO Cloud"
          }));
        } else if (messageType === "pong") {
          bridgeRegistry.updatePing(bridgeId);
        } else if (messageType === "status") {
          logger.info({ bridgeId, status: message }, "Bridge status update");
        }
      } catch (error) {
        logger.error({ error, bridgeId }, "Error parsing bridge message");
      }
    });

    socket.on("close", () => {
      bridgeRegistry.unregister(bridgeId);
    });

    socket.on("error", (error) => {
      logger.error({ error, bridgeId }, "Bridge WebSocket error");
      bridgeRegistry.unregister(bridgeId);
    });

    // Send periodic pings
    const pingInterval = setInterval(() => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });

  // Upload segment endpoint
  app.post("/bridge/upload-segment", async (request, reply) => {
    const apiKey = request.headers["x-api-key"] as string;
    const bridgeId = request.headers["x-bridge-id"] as string;

    if (!apiKey || !bridgeId) {
      return reply.code(401).send({ error: "Missing credentials" });
    }

    if (!bridgeAuthStore.validate(bridgeId, apiKey)) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    try {
      const form = formidable({
        maxFileSize: 10 * 1024 * 1024, // 10MB max
      });

      const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
        (resolve, reject) => {
          form.parse(request.raw, (err, fields, files) => {
            if (err) reject(err);
            else resolve([fields, files]);
          });
        }
      );

      const cameraId = Array.isArray(fields.camera_id) ? fields.camera_id[0] : fields.camera_id;
      const uploadBridgeId = Array.isArray(fields.bridge_id) ? fields.bridge_id[0] : fields.bridge_id;
      const fileArray = files.file;
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

      if (!file || !cameraId || !uploadBridgeId) {
        return reply.code(400).send({ error: "Missing required fields" });
      }
      
      if (uploadBridgeId !== bridgeId) {
        return reply.code(403).send({ error: "Bridge ID mismatch" });
      }

      // Create storage directory
      const storageDir = path.join(process.cwd(), "storage", "streams", uploadBridgeId, cameraId);
      await fs.mkdir(storageDir, { recursive: true });

      // Save file
      const fileName = file.originalFilename || `segment_${Date.now()}.ts`;
      const destPath = path.join(storageDir, fileName);
      await fs.copyFile(file.filepath, destPath);
      await fs.unlink(file.filepath); // Clean up temp file

      logger.debug({ bridgeId, cameraId, fileName }, "Segment uploaded");

      return reply.send({ success: true, file: fileName });
    } catch (error) {
      logger.error({ error }, "Upload error");
      return reply.code(500).send({ error: "Upload failed" });
    }
  });

  // Upload file endpoint (for playlists)
  app.post("/bridge/upload-file", async (request, reply) => {
    const apiKey = request.headers["x-api-key"] as string;
    const bridgeId = request.headers["x-bridge-id"] as string;

    if (!apiKey || !bridgeId) {
      return reply.code(401).send({ error: "Missing credentials" });
    }

    if (!bridgeAuthStore.validate(bridgeId, apiKey)) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    try {
      const form = formidable({
        maxFileSize: 1 * 1024 * 1024, // 1MB max for playlists
      });

      const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
        (resolve, reject) => {
          form.parse(request.raw, (err, fields, files) => {
            if (err) reject(err);
            else resolve([fields, files]);
          });
        }
      );

      const cameraId = Array.isArray(fields.camera_id) ? fields.camera_id[0] : fields.camera_id;
      const uploadBridgeId = Array.isArray(fields.bridge_id) ? fields.bridge_id[0] : fields.bridge_id;
      const fileArray = files.file;
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

      if (!file || !cameraId || !uploadBridgeId) {
        return reply.code(400).send({ error: "Missing required fields" });
      }
      
      if (uploadBridgeId !== bridgeId) {
        return reply.code(403).send({ error: "Bridge ID mismatch" });
      }

      const storageDir = path.join(process.cwd(), "storage", "streams", bridgeId, cameraId);
      await fs.mkdir(storageDir, { recursive: true });

      const fileName = file.originalFilename || "file";
      const destPath = path.join(storageDir, fileName);
      await fs.copyFile(file.filepath, destPath);
      await fs.unlink(file.filepath);

      logger.debug({ bridgeId, cameraId, fileName }, "File uploaded");

      return reply.send({ success: true, file: fileName });
    } catch (error) {
      logger.error({ error }, "Upload error");
      return reply.code(500).send({ error: "Upload failed" });
    }
  });

  // Serve HLS stream
  app.get("/bridge/stream/:bridgeId/:cameraId/playlist.m3u8", async (request, reply) => {
    const { bridgeId, cameraId } = request.params as { bridgeId: string; cameraId: string };

    const filePath = path.join(process.cwd(), "storage", "streams", bridgeId, cameraId, "playlist.m3u8");

    try {
      await fs.access(filePath);
      reply.type("application/vnd.apple.mpegurl");
      return reply.sendFile("playlist.m3u8", path.dirname(filePath));
    } catch {
      return reply.code(404).send({ error: "Stream not found" });
    }
  });

  // Serve HLS segments
  app.get("/bridge/stream/:bridgeId/:cameraId/:segment", async (request, reply) => {
    const { bridgeId, cameraId, segment } = request.params as {
      bridgeId: string;
      cameraId: string;
      segment: string;
    };

    // Validate segment name (security)
    if (!/^segment_\d+\.ts$/.test(segment)) {
      return reply.code(400).send({ error: "Invalid segment name" });
    }

    const filePath = path.join(process.cwd(), "storage", "streams", bridgeId, cameraId, segment);

    try {
      await fs.access(filePath);
      reply.type("video/mp2t");
      return reply.sendFile(segment, path.dirname(filePath));
    } catch {
      return reply.code(404).send({ error: "Segment not found" });
    }
  });

  // List connected bridges
  app.get("/bridge/list", async (_request, reply) => {
    const bridges = bridgeRegistry.list().map((b) => ({
      bridgeId: b.bridgeId,
      bridgeName: b.bridgeName,
      connectedAt: b.connectedAt,
      lastPing: b.lastPing,
    }));

    return reply.send({ bridges });
  });

  // Send command to bridge
  app.post("/bridge/:bridgeId/command", async (request, reply) => {
    const { bridgeId } = request.params as { bridgeId: string };
    const command = request.body as { type: string; [key: string]: any };

    const bridge = bridgeRegistry.get(bridgeId);
    if (!bridge) {
      return reply.code(404).send({ error: "Bridge not connected" });
    }

    try {
      bridge.ws.send(JSON.stringify(command));
      return reply.send({ success: true });
    } catch (error) {
      logger.error({ error, bridgeId }, "Failed to send command to bridge");
      return reply.code(500).send({ error: "Failed to send command" });
    }
  });
}

export { bridgeRegistry };
