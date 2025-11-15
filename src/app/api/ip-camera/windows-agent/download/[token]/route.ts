import { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import { getAgentByToken, revokeAgent } from "../../store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const token = params.token;
  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  const record = await getAgentByToken(token);
  if (!record) {
    return new Response("Agent not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(record.filePath);
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": record.contentType,
        "Content-Disposition": `attachment; filename="${record.fileName}"`,
        "Content-Length": data.byteLength.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    await revokeAgent(token);
    const message =
      error instanceof Error ? error.message : "Failed to read agent file";
    return new Response(message, { status: 410 });
  }
}
