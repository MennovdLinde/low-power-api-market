import { Request, Response, NextFunction } from 'express';
import { isOverQuota } from '../services/usage';
import { quotaExhaustion } from '../services/metrics';

export async function metering(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { keyId, plan } = req.context;

  if (await isOverQuota(keyId, plan)) {
    quotaExhaustion.inc({ plan });
    res.status(402).json({
      error: 'Monthly quota exceeded',
      message: plan === 'free'
        ? 'You have used your 1M free requests. Upgrade to Pro for 100M requests/month.'
        : 'Monthly quota of 100M requests reached. Contact support.',
    });
    return;
  }

  next();
}
