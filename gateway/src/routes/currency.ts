import { Router, Request, Response } from 'express';
import axios from 'axios';
import { env } from '../config/env';
import { cacheGet, cacheSet } from '../services/cache';
import { incrementUsage, queueUsageEvent } from '../services/usage';
import { queueStripeUsage } from '../services/stripe';
import { cacheHits, cacheMisses, apiCallsTotal, upstreamDuration, rustServiceDuration } from '../services/metrics';
import type { CurrencyResult } from '../types';

export const currencyRouter = Router();

currencyRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const start = Date.now();
  const { keyId, userId, plan } = req.context;
  const from = ((req.query.from as string) ?? 'USD').toUpperCase();
  const to = ((req.query.to as string) ?? 'EUR').toUpperCase();
  const amount = parseFloat((req.query.amount as string) ?? '1');

  if (isNaN(amount) || amount <= 0) {
    res.status(400).json({ error: 'amount must be a positive number' });
    return;
  }

  const ratesCacheKey = `lpa:cache:currency:${from}`;

  // Cache check for rates
  let rates = await cacheGet<Record<string, number>>(ratesCacheKey);
  let cacheHit = !!rates;

  if (!rates) {
    cacheMisses.inc({ endpoint: 'currency' });
    const upstreamStart = Date.now();
    const upstream = await axios.get(`https://api.frankfurter.app/latest?from=${from}`, { timeout: 5000 });
    upstreamDuration.observe({ provider: 'frankfurter', endpoint: 'currency' }, Date.now() - upstreamStart);
    rates = upstream.data.rates as Record<string, number>;
    rates[from] = 1; // base currency is always 1:1
    await cacheSet(ratesCacheKey, rates, 1800);
  } else {
    cacheHits.inc({ endpoint: 'currency' });
  }

  let result: CurrencyResult;

  // Try Rust currency calc, fall back to inline
  try {
    const rustStart = Date.now();
    const rustRes = await axios.post(
      `${env.RUST_CURRENCY_URL}/convert`,
      { rates, from, to, amount },
      { timeout: 2000 }
    );
    rustServiceDuration.observe({ service: 'currency-calc' }, Date.now() - rustStart);
    result = rustRes.data as CurrencyResult;
  } catch {
    const rate = rates[to];
    if (!rate) {
      res.status(400).json({ error: `Unknown currency: ${to}` });
      return;
    }
    result = {
      from,
      to,
      rate: parseFloat(rate.toFixed(4)),
      amount,
      converted: parseFloat((amount * rate).toFixed(4)),
      date: new Date().toISOString().slice(0, 10),
      source: 'frankfurter.app (ECB)',
    };
  }

  await incrementUsage(keyId);
  await queueStripeUsage(userId, plan);
  await queueUsageEvent({ keyId, userId, endpoint: 'currency', cached: cacheHit, latencyMs: Date.now() - start, statusCode: 200 });
  apiCallsTotal.inc({ endpoint: 'currency', plan, status: '200' });

  res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
  res.json(result);
});
