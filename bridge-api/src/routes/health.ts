import { FastifyInstance } from "fastify";
import { deviceStore } from "../store";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  app.get("/metrics", async (request, reply) => {
    const devices = deviceStore.list();
    const lines: string[] = [
      "# HELP bridge_device_count Total devices registered",
      "# TYPE bridge_device_count gauge",
      `bridge_device_count ${devices.length}`,
      "# HELP bridge_device_fps Frames per second observed per device",
      "# TYPE bridge_device_fps gauge",
      "# HELP bridge_device_bitrate_kbps Bitrate per device in kbps",
      "# TYPE bridge_device_bitrate_kbps gauge",
    ];
    for (const device of devices) {
      const labels = `{device_id="${device.id}",name="${device.name.replace(/"/g, '\\"')}"}`;
      lines.push(`bridge_device_fps${labels} ${device.status.fps}`);
      lines.push(`bridge_device_bitrate_kbps${labels} ${device.status.bitrateKbps}`);
    }
    reply.header("content-type", "text/plain; version=0.0.4");
    return reply.send(lines.join("\n"));
  });
}
