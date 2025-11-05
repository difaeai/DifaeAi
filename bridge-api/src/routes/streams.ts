import { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_PRIVATE_KEY,
  JANUS_WS_URL,
  HLS_BASE_URL,
  TOKEN_TTL_SECONDS,
} from "../config";
import jwt from "jsonwebtoken";

const tokenRequestSchema = z.object({
  scope: z.array(z.enum(["webrtc", "hls"])).default(["webrtc", "hls"]),
});

export async function streamRoutes(app: FastifyInstance) {
  app.post("/streams/:id/token", async (request, reply) => {
    if (!JWT_PRIVATE_KEY) {
      return reply.internalServerError("JWT private key missing");
    }

    const { id } = request.params as { id: string };
    const parsed = tokenRequestSchema.parse(request.body ?? {});

    const expiresIn = TOKEN_TTL_SECONDS;
    const token = jwt.sign(
      {
        cameraId: id,
        scope: parsed.scope,
      },
      JWT_PRIVATE_KEY,
      {
        algorithm: "RS256",
        expiresIn,
        audience: JWT_AUDIENCE,
        issuer: JWT_ISSUER,
        subject: id,
      },
    );

    return reply.send({
      token,
      expiresIn,
      cameraId: id,
      mountpoint: id,
      playback: {
        webrtc: JANUS_WS_URL,
        hls: `${HLS_BASE_URL}/hls/${id}.m3u8?token=${token}`,
      },
    });
  });
}
