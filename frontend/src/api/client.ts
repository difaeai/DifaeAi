export interface ProbeCandidate {
  protocol: 'rtsp' | 'mjpeg' | 'onvif';
  url: string;
  confidence: number;
  verified: boolean;
  verificationMethod: 'ffprobe' | 'http-head' | 'onvif-ping' | 'none';
  latencyMs?: number;
  notes?: string;
  requiresAuth?: boolean;
}

export interface ProbeResponse {
  candidates: ProbeCandidate[];
}

export async function probeCamera(ip: string, type: string, includeOnvif = true): Promise<ProbeResponse> {
  const response = await fetch('/api/camera/probe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip, type, includeOnvif }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message ?? 'Probe failed');
  }

  return response.json();
}
