import { Router, Request, Response } from 'express';
import dns from 'dns/promises';
import { cacheGet, cacheSet } from '../services/cache';
import { incrementUsage, queueUsageEvent } from '../services/usage';
import { queueStripeUsage } from '../services/stripe';
import { cacheHits, cacheMisses, apiCallsTotal } from '../services/metrics';
import type { EmailResult } from '../types';

export const emailRouter = Router();

// Common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'temp-mail.org', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'spam4.me', 'trashmail.com', 'dispostable.com',
  'maildrop.cc', '10minutemail.com', 'tempmail.com', 'fakeinbox.com',
]);

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

emailRouter.get('/validate', async (req: Request, res: Response): Promise<void> => {
  const start = Date.now();
  const { keyId, userId, plan } = req.context;
  const email = (req.query.email as string)?.toLowerCase().trim();

  if (!email) {
    res.status(400).json({ error: 'email query parameter is required' });
    return;
  }

  const isValidSyntax = EMAIL_REGEX.test(email);
  const domain = email.split('@')[1] ?? '';
  const cacheKey = `lpa:cache:email:${domain}`;

  let hasMx = false;
  let cacheHit = false;

  const cachedDomain = await cacheGet<{ hasMx: boolean }>(cacheKey);
  if (cachedDomain) {
    cacheHits.inc({ endpoint: 'email' });
    hasMx = cachedDomain.hasMx;
    cacheHit = true;
  } else {
    cacheMisses.inc({ endpoint: 'email' });
    if (isValidSyntax && domain) {
      try {
        const records = await dns.resolveMx(domain);
        hasMx = records.length > 0;
      } catch {
        hasMx = false;
      }
      await cacheSet(cacheKey, { hasMx }, 86400);
    }
  }

  const result: EmailResult = {
    email,
    isValidSyntax,
    hasMx,
    isDisposable: DISPOSABLE_DOMAINS.has(domain),
    domain,
  };

  await incrementUsage(keyId);
  await queueStripeUsage(userId, plan);
  await queueUsageEvent({ keyId, userId, endpoint: 'email', cached: cacheHit, latencyMs: Date.now() - start, statusCode: 200 });
  apiCallsTotal.inc({ endpoint: 'email', plan, status: '200' });

  res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
  res.json(result);
});
