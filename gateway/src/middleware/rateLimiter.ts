import { Request, Response, NextFunction } from 'express';
import { redis } from '../services/cache';
import { rateLimitRejections } from '../services/metrics';

const PLAN_RPM: Record<string, number> = {
  free: 60,
  pro: 600,
};

export async function rateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { keyId, plan } = req.context;
  const window = Math.floor(Date.now() / 60_000);
  const key = `lpa:rl:${keyId}:${window}`;

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 120);

  const limit = PLAN_RPM[plan] ?? PLAN_RPM.free;
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));
  res.setHeader('X-RateLimit-Reset', (window + 1) * 60);

  if (count > limit) {
    const endpoint = req.path.split('/')[1] ?? 'unknown';
    rateLimitRejections.inc({ endpoint, plan });
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: (window + 1) * 60 - Math.floor(Date.now() / 1000),
    });
    return;
  }

  next();
}
