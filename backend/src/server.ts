import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { cameraRouter } from './routes/camera.js';
import { logger } from './utils/logger.js';

export function createServer() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-origin' },
    }),
  );
  app.use((pinoHttp as any)({ logger }));

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/camera', cameraRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
