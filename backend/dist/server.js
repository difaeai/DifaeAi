import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
const pinoHttp = require('pino-http');
import { cameraRouter } from './routes/camera.js';
import { logger } from './utils/logger.js';
export function createServer() {
    const app = express();
    app.disable('x-powered-by');
    app.use(express.json({ limit: '1mb' }));
    app.use(cors({ origin: true, credentials: true }));
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'same-origin' },
    }));
    app.use(pinoHttp({ logger }));
    app.get('/healthz', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    app.use('/api/camera', cameraRouter);
    app.use((err, _req, res, _next) => {
        logger.error({ err }, 'Unhandled error');
        res.status(500).json({ error: 'Internal server error' });
    });
    return app;
}
//# sourceMappingURL=server.js.map