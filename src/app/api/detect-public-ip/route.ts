import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isPublicIPv4 } from "@/lib/network/ip";

const HEADER_CANDIDATES = [
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "fastly-client-ip",
  "true-client-ip",
  "x-client-ip",
  "x-cluster-client-ip",
  "x-forwarded",
  "forwarded",
  "x-vercel-forwarded-for",
  "x-appengine-user-ip",
];

function extractIpFromHeader(value: string, headerName: string): string | null {
  if (!value) return null;

  if (headerName === "forwarded") {
    const forwardedParts = value.split(";");
    for (const part of forwardedParts) {
      const trimmed = part.trim();
      if (trimmed.toLowerCase().startsWith("for=")) {
        const forValue = trimmed.substring(4).replace(/^["'\[]+|["'\]]+$/g, "");
        const candidate = forValue.split(",")[0]?.trim();
        if (candidate) {
          return candidate;
        }
      }
    }
    return null;
  }

  const candidate = value.split(",")[0]?.trim();
  return candidate || null;
}

export async function GET(request: Request) {
  const headerList = headers();

  const candidates: string[] = [];

  for (const header of HEADER_CANDIDATES) {
    const fromStaticHeaders = headerList.get(header);
    if (fromStaticHeaders) {
      const candidate = extractIpFromHeader(fromStaticHeaders, header);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    const fromRequest = request.headers.get(header);
    if (fromRequest) {
      const candidate = extractIpFromHeader(fromRequest, header);
      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  const publicIp = candidates.find((ip) => isPublicIPv4(ip));

  return NextResponse.json({ ip: publicIp ?? null });
}
