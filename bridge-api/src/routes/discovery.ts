import { FastifyInstance } from "fastify";

export async function discoveryRoutes(app: FastifyInstance) {
  app.post("/discover/onvif", async (request, reply) => {
    // Placeholder implementation: respond with static mock to unblock clients.
    // Real implementation should use WS-Discovery probes and parse ONVIF responses.
    return reply.send({
      devices: [
        {
          id: "mock-onvif-001",
          name: "Mock ONVIF Cam",
          ip: "192.168.1.120",
          mac: "00:11:22:33:44:55",
          model: "Simulated",
          vendor: "CameraBridge",
        },
      ],
    });
  });
}
