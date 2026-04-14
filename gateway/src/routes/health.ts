import { Router, Request, Response } from 'express';
import { registry } from '../services/metrics';
import { db } from '../db';
import { redis } from '../services/cache';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  try {
    await db.query('SELECT 1');
    checks.postgres = 'ok';
  } catch {
    checks.postgres = 'error';
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');
  res.status(allOk ? 200 : 503).json({ status: allOk ? 'ok' : 'degraded', checks });
});

healthRouter.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
});
