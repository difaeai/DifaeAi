import type { NetworkDeviceCandidate } from '@/state/useCameraStore';

function normalizeIpPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const candidate = payload as Record<string, unknown>;
  const possibleKeys = ['ip', 'ipAddress', 'ip_address', 'query', 'IPv4', 'ipv4'];
  for (const key of possibleKeys) {
    const value = candidate[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function extractIpFromText(text: string): string | undefined {
  const match = text.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
  return match?.[1];
}

export async function fetchPublicIpAddress(): Promise<string> {
  const endpoints = [
    { url: '/api/network/public-ip', parseJson: true },
    { url: 'https://www.whatismyip.com/wp-json/whatismyip/v1/ip', parseJson: true },
    { url: 'https://www.whatismyip.com/', parseJson: false },
  ] as const;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, { cache: 'no-store' });
      if (!response.ok) {
        continue;
      }

      if (endpoint.parseJson) {
        const payload = await response.json();
        const ip = normalizeIpPayload(payload);
        if (ip) {
          return ip;
        }
        continue;
      }

      const html = await response.text();
      const ip = extractIpFromText(html);
      if (ip) {
        return ip;
      }
    } catch (error) {
      // Continue to the next fallback endpoint.
      console.warn('Failed to resolve public IP from endpoint', endpoint.url, error);
    }
  }

  throw new Error('Unable to determine public IP address from whatismyip.com');
}

export async function scanLocalNetworkForMacs(): Promise<NetworkDeviceCandidate[]> {
  try {
    const response = await fetch('/api/network/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const payload = (await response.json()) as { devices?: NetworkDeviceCandidate[] };
      if (Array.isArray(payload.devices) && payload.devices.length > 0) {
        return payload.devices;
      }
    }
  } catch (error) {
    console.warn('Network scan API unavailable, falling back to simulated results.', error);
  }

  // Provide a deterministic fallback to help users understand the workflow even when
  // local network scanning is not available from the browser environment.
  return [
    {
      mac: '00:11:22:33:44:55',
      ip: '192.168.1.120',
      hostname: 'Simulated Camera',
      vendor: 'Demo',
      isSimulated: true,
    },
    {
      mac: 'AA:BB:CC:DD:EE:FF',
      ip: '192.168.1.150',
      hostname: 'Simulated NVR',
      vendor: 'Demo',
      isSimulated: true,
    },
  ];
}
