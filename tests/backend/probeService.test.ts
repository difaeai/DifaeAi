import { describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/probeHelpers.js', () => ({
  checkStreamWithFfprobe: vi.fn(async (url: string) => url.includes('live.sdp')),
  headRequest: vi.fn(async (url: string) => ({
    ok: url.includes('/video.cgi'),
    status: url.includes('/video.cgi') ? 200 : 404,
    statusText: url.includes('/video.cgi') ? 'OK' : 'Not Found',
    requiresAuth: false,
  })),
}));

vi.mock('@/services/probeOnvif.js', () => ({
  probeOnvifService: vi.fn(async () => ({
    protocol: 'onvif' as const,
    url: 'http://192.168.1.10:80/onvif/device_service',
    confidence: 0.95,
    verified: true,
    verificationMethod: 'onvif-ping' as const,
  })),
}));

import { probeCameraEndpoints } from '@/services/probeService.js';

describe('probeCameraEndpoints', () => {
  it('returns validated candidates ordered by verification then confidence', async () => {
    const result = await probeCameraEndpoints({ ip: '192.168.1.10', type: 'ip', includeOnvif: true });
    expect(result[0]?.protocol).toBe('onvif');
    const rtspCandidate = result.find((candidate) => candidate.protocol === 'rtsp');
    expect(rtspCandidate?.verified).toBe(true);
    const mjpegCandidate = result.find((candidate) => candidate.protocol === 'mjpeg');
    expect(mjpegCandidate?.verified).toBe(true);
  });

  it('falls back gracefully when ONVIF disabled', async () => {
    const result = await probeCameraEndpoints({ ip: '192.168.1.10', type: 'ip', includeOnvif: false });
    expect(result.some((candidate) => candidate.protocol === 'onvif')).toBe(false);
    expect(result.some((candidate) => candidate.protocol === 'rtsp')).toBe(true);
  });
});
