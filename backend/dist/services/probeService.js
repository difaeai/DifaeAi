import asyncPool from 'tiny-async-pool';
import { probeOnvifService } from './probeOnvif.js';
import { buildRtspUrls, MJPEG_PATHS } from './probePaths.js';
import { checkStreamWithFfprobe, headRequest } from '../utils/probeHelpers.js';
import { logger } from '../utils/logger.js';
const VERIFICATION_TIMEOUT_MS = 3000;
const MAX_PARALLEL_PROBES = 2;
export async function probeCameraEndpoints(request) {
    const { ip, type, includeOnvif } = request;
    const host = normalizeHost(ip);
    const results = [];
    if (includeOnvif) {
        try {
            const onvifResult = await probeOnvifService(host);
            if (onvifResult) {
                results.push(onvifResult);
            }
        }
        catch (error) {
            logger.debug({ err: error, host }, 'ONVIF probe failed');
        }
    }
    const rtspCandidates = buildRtspUrls(host, type);
    const verifiedRtsp = await asyncPool(MAX_PARALLEL_PROBES, rtspCandidates, async (candidate) => {
        try {
            const startedAt = Date.now();
            const verified = await checkStreamWithFfprobe(candidate, VERIFICATION_TIMEOUT_MS);
            return {
                protocol: 'rtsp',
                url: candidate,
                confidence: candidate.includes('main') || candidate.includes('profile1') ? 0.9 : 0.6,
                verified,
                verificationMethod: 'ffprobe',
                latencyMs: verified ? Date.now() - startedAt : undefined,
                requiresAuth: candidate.includes('@'),
                notes: verified ? undefined : 'ffprobe timed out or returned no frames',
            };
        }
        catch (error) {
            logger.debug({ err: error, candidate }, 'RTSP probe failed');
            return {
                protocol: 'rtsp',
                url: candidate,
                confidence: 0.3,
                verified: false,
                verificationMethod: 'ffprobe',
                requiresAuth: candidate.includes('@'),
                notes: 'ffprobe error',
            };
        }
    });
    results.push(...verifiedRtsp);
    const mjpegCandidates = MJPEG_PATHS.map((path) => `http://${host}${path}`);
    const verifiedMjpeg = await asyncPool(MAX_PARALLEL_PROBES, mjpegCandidates, async (candidate) => {
        const startedAt = Date.now();
        const headResponse = await headRequest(candidate, VERIFICATION_TIMEOUT_MS);
        return {
            protocol: 'mjpeg',
            url: candidate,
            confidence: headResponse.ok ? 0.6 : 0.2,
            verified: headResponse.ok,
            verificationMethod: 'http-head',
            latencyMs: headResponse.ok ? Date.now() - startedAt : undefined,
            requiresAuth: headResponse.status === 401,
            notes: headResponse.statusText,
        };
    });
    results.push(...verifiedMjpeg);
    return results
        .filter((candidate) => candidate.confidence > 0)
        .sort((a, b) => Number(b.verified) - Number(a.verified) || b.confidence - a.confidence);
}
function normalizeHost(input) {
    const cleaned = input.trim();
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
        return cleaned.replace(/^https?:\/\//, '');
    }
    if (cleaned.startsWith('rtsp://')) {
        return cleaned.replace(/^rtsp:\/\//, '');
    }
    return cleaned;
}
//# sourceMappingURL=probeService.js.map