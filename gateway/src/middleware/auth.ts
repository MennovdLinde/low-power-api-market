import { Request, Response, NextFunction } from 'express';
import { lookupApiKey } from '../services/apiKeys';

export async function auth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const rawKey = req.headers['x-api-key'];
  if (!rawKey || typeof rawKey !== 'string') {
    res.status(401).json({ error: 'Missing X-API-Key header' });
    return;
  }

  const context = await lookupApiKey(rawKey);
  if (!context) {
    res.status(401).json({ error: 'Invalid or revoked API key' });
    return;
  }

  req.context = context;
  next();
}
