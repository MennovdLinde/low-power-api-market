import { Router, Request, Response } from 'express';
import axios from 'axios';
import { env } from '../config/env';
import { cacheGet, cacheSet } from '../services/cache';
import { incrementUsage, queueUsageEvent } from '../services/usage';
import { queueStripeUsage } from '../services/stripe';
import { cacheHits, cacheMisses, apiCallsTotal, upstreamDuration, rustServiceDuration } from '../services/metrics';
import type { GeoResult } from '../types';

export const geoRouter = Router();

geoRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const start = Date.now();
  const { keyId, userId, plan } = req.context;
  const ip = (req.query.ip as string) || req.ip || '8.8.8.8';
  const cacheKey = `lpa:cache:geo:${ip}`;

  // Cache check
  const cached = await cacheGet<GeoResult>(cacheKey);
  if (cached) {
    cacheHits.inc({ endpoint: 'geo' });
    apiCallsTotal.inc({ endpoint: 'geo', plan, status: '200' });
    await incrementUsage(keyId);
    await queueStripeUsage(userId, plan);
    await queueUsageEvent({ keyId, userId, endpoint: 'geo', cached: true, latencyMs: Date.now() - start, statusCode: 200 });
    res.setHeader('X-Cache', 'HIT');
    res.json(cached);
    return;
  }

  cacheMisses.inc({ endpoint: 'geo' });

  // Fetch from ip-api.com
  const upstreamStart = Date.now();
  const upstream = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,lat,lon,timezone,isp,query`, { timeout: 5000 });
  upstreamDuration.observe({ provider: 'ip-api', endpoint: 'geo' }, Date.now() - upstreamStart);

  if (upstream.data.status !== 'success') {
    res.status(422).json({ error: 'Could not resolve IP geolocation' });
    return;
  }

  let result: GeoResult;

  // Try Rust normalizer, fall back to inline
  try {
    const rustStart = Date.now();
    const rustRes = await axios.post(`${env.RUST_GEO_URL}/normalise`, { raw: upstream.data }, { timeout: 2000 });
    rustServiceDuration.observe({ service: 'geo-normalizer' }, Date.now() - rustStart);
    result = rustRes.data as GeoResult;
  } catch {
    result = {
      ip: upstream.data.query,
      country: upstream.data.country,
      countryCode: upstream.data.countryCode,
      region: upstream.data.region,
      city: upstream.data.city,
      lat: upstream.data.lat,
      lon: upstream.data.lon,
      timezone: upstream.data.timezone,
      isp: upstream.data.isp,
    };
  }

  await cacheSet(cacheKey, result, 3600);
  await incrementUsage(keyId);
  await queueStripeUsage(userId, plan);
  await queueUsageEvent({ keyId, userId, endpoint: 'geo', cached: false, latencyMs: Date.now() - start, statusCode: 200 });
  apiCallsTotal.inc({ endpoint: 'geo', plan, status: '200' });

  res.setHeader('X-Cache', 'MISS');
  res.json(result);
});
