import { Router } from 'express';
import { z } from 'zod';
import { probeCameraEndpoints } from '../services/probeService.js';
const probeRequestSchema = z.object({
    ip: z.string().min(3, 'Camera IP or hostname is required'),
    type: z.enum(['ip', 'dvr', 'nvr', 'usb', 'mobile', 'cloud']).default('ip'),
    includeOnvif: z.boolean().optional(),
});
export const cameraRouter = Router();
cameraRouter.post('/probe', async (req, res) => {
    const parseResult = probeRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
    }
    const { ip, type, includeOnvif } = parseResult.data;
    try {
        const candidates = await probeCameraEndpoints({
            ip,
            type,
            includeOnvif: (includeOnvif ?? false) || type === 'ip' || type === 'dvr' || type === 'nvr'
        });
        return res.json({ candidates });
    }
    catch (error) {
        return res.status(500).json({ error: 'Probe failed', message: error.message });
    }
});
//# sourceMappingURL=camera.js.map