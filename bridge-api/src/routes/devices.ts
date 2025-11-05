import { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { deviceStore, toPublicDevice } from "../store";
import { ingestClient } from "../services/ingest-client";
import { DeviceRecord } from "../types";

const createDeviceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["rtsp", "onvif", "p2p"]),
  ip: z.string().optional(),
  rtspUrl: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  siteId: z.string().optional(),
  vendor: z.string().optional(),
  model: z.string().optional(),
  notes: z.string().optional(),
});

const startSchema = z.object({
  profile: z.enum(["main", "sub"]).default("main").optional(),
  targets: z
    .array(z.enum(["webrtc", "hls"]))
    .min(1)
    .default(["webrtc"]),
});

const metricsSchema = z.object({
  fps: z.number().nonnegative().optional(),
  bitrateKbps: z.number().nonnegative().optional(),
  lastKeyframeTs: z.string().optional(),
  ingestState: z.enum(["idle", "starting", "running", "stopping", "error"]).optional(),
  targets: z.array(z.enum(["webrtc", "hls"])).optional(),
  lastHeartbeat: z.string().optional(),
  lastError: z.string().optional(),
});

export async function devicesRoutes(app: FastifyInstance) {
  app.get("/devices", async () => {
    return deviceStore.list().map(toPublicDevice);
  });

  app.get("/devices/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const device = deviceStore.get(id);
    if (!device) {
      return reply.notFound("Device not found");
    }

    return reply.send(toPublicDevice(device));
  });

  app.post("/devices", async (request, reply) => {
    const parsed = createDeviceSchema.parse(request.body);
    const record = deviceStore.create({
      name: parsed.name,
      type: parsed.type,
      vendor: parsed.vendor,
      model: parsed.model,
      siteId: parsed.siteId,
      ip: parsed.ip,
      notes: parsed.notes,
      credentials: {
        username: parsed.username,
        password: parsed.password,
        rtspUrl: parsed.rtspUrl,
      },
    });

    return reply.code(201).send({ id: record.id });
  });

  app.get("/devices/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const device = deviceStore.get(id);
    if (!device) {
      return reply.notFound("Device not found");
    }

    return reply.send(device.status);
  });

  app.post("/devices/:id/start", async (request, reply) => {
    const { id } = request.params as { id: string };
    const device = requireDevice(id, reply);
    if (!device) return;

    const parsed = startSchema.parse(request.body ?? {});
    deviceStore.updateStatus(id, {
      ingestState: "starting",
      targets: parsed.targets,
      lastError: undefined,
    });

    await ingestClient.start({
      deviceId: id,
      profile: parsed.profile,
      targets: parsed.targets,
    });

    deviceStore.updateStatus(id, {
      ingestState: "running",
      lastHeartbeat: new Date().toISOString(),
    });

    return reply.send({ ok: true });
  });

  app.post("/devices/:id/stop", async (request, reply) => {
    const { id } = request.params as { id: string };
    const device = requireDevice(id, reply);
    if (!device) return;

    deviceStore.updateStatus(id, { ingestState: "stopping" });
    await ingestClient.stop(id);
    deviceStore.updateStatus(id, { ingestState: "idle", targets: [], fps: 0, bitrateKbps: 0 });

    return reply.send({ ok: true });
  });

  app.post("/devices/:id/test-rtsp", async (request, reply) => {
    const { id } = request.params as { id: string };
    const device = requireDevice(id, reply);
    if (!device) return;
    if (!device.credentials.rtspUrl) {
      return reply.badRequest("RTSP URL missing");
    }

    // Stubbed response for now; actual implementation should run ffprobe
    return reply.send({
      fps: 25,
      videoCodec: "h264",
      audioCodec: "aac",
      resolution: "1920x1080",
    });
  });

  app.post("/devices/:id/metrics", async (request, reply) => {
    const { id } = request.params as { id: string };
    const device = requireDevice(id, reply);
    if (!device) return;

    const parsed = metricsSchema.parse(request.body ?? {});
    deviceStore.updateStatus(id, {
      fps: parsed.fps ?? device.status.fps,
      bitrateKbps: parsed.bitrateKbps ?? device.status.bitrateKbps,
      lastKeyframeTs: parsed.lastKeyframeTs ?? device.status.lastKeyframeTs,
      ingestState: parsed.ingestState ?? device.status.ingestState,
      targets: parsed.targets ?? device.status.targets,
      lastHeartbeat: parsed.lastHeartbeat ?? new Date().toISOString(),
      lastError: parsed.lastError,
    });

    return reply.send({ ok: true });
  });
}

function requireDevice(id: string, reply: FastifyReply): DeviceRecord | undefined {
  const device = deviceStore.get(id);
  if (!device) {
    reply.notFound("Device not found");
    return;
  }
  return device;
}
