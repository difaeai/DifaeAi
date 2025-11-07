import { logger } from '../utils/logger.js';

const DEFAULT_PORTS = [80, 8000, 8080];
const ONVIF_TIMEOUT_MS = 3000;

export async function probeOnvifService(host: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ONVIF_TIMEOUT_MS);

  try {
    for (const port of DEFAULT_PORTS) {
      const url = `http://${host}:${port}/onvif/device_service`;
      try {
        const response = await fetch(`${url}?wsdl`, {
          method: 'GET',
          signal: controller.signal,
        });

        if (response.ok) {
          return {
            protocol: 'onvif' as const,
            url,
            confidence: 0.95,
            verified: true,
            verificationMethod: 'onvif-ping' as const,
            notes: 'ONVIF device_service responded with HTTP 200',
            requiresAuth: response.status === 401,
          };
        }

        if (response.status === 401) {
          return {
            protocol: 'onvif' as const,
            url,
            confidence: 0.7,
            verified: false,
            verificationMethod: 'onvif-ping' as const,
            notes: 'Authentication required for ONVIF endpoint',
            requiresAuth: true,
          };
        }
      } catch (error) {
        logger.debug({ err: error, url }, 'ONVIF HTTP probe failed');
      }
    }
  } finally {
    clearTimeout(timer);
  }

  return null;
}
