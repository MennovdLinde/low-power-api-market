import { Router, Request, Response } from 'express';
import axios from 'axios';
import { cacheGet, cacheSet } from '../services/cache';
import { incrementUsage, queueUsageEvent } from '../services/usage';
import { queueStripeUsage } from '../services/stripe';
import { cacheHits, cacheMisses, apiCallsTotal, upstreamDuration } from '../services/metrics';
import type { WeatherResult } from '../types';

export const weatherRouter = Router();

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Icing fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
  55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 80: 'Slight showers',
  81: 'Moderate showers', 82: 'Heavy showers', 95: 'Thunderstorm',
};

weatherRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const start = Date.now();
  const { keyId, userId, plan } = req.context;

  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const unit = (req.query.unit as string) === 'fahrenheit' ? 'fahrenheit' : 'celsius';

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    res.status(400).json({ error: 'lat and lon are required and must be valid coordinates' });
    return;
  }

  const cacheKey = `lpa:cache:weather:${lat.toFixed(2)}:${lon.toFixed(2)}:${unit}`;
  const cached = await cacheGet<WeatherResult>(cacheKey);

  if (cached) {
    cacheHits.inc({ endpoint: 'weather' });
    apiCallsTotal.inc({ endpoint: 'weather', plan, status: '200' });
    await incrementUsage(keyId);
    await queueStripeUsage(userId, plan);
    await queueUsageEvent({ keyId, userId, endpoint: 'weather', cached: true, latencyMs: Date.now() - start, statusCode: 200 });
    res.setHeader('X-Cache', 'HIT');
    res.json(cached);
    return;
  }

  cacheMisses.inc({ endpoint: 'weather' });

  const upstreamStart = Date.now();
  const upstream = await axios.get(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,windspeed_10m&temperature_unit=${unit}&timezone=auto&forecast_days=1`,
    { timeout: 5000 }
  );
  upstreamDuration.observe({ provider: 'open-meteo', endpoint: 'weather' }, Date.now() - upstreamStart);

  const cw = upstream.data.current_weather;
  const hourly = upstream.data.hourly;
  const nowIndex = 0;

  const result: WeatherResult = {
    lat,
    lon,
    temperature: cw.temperature,
    feelsLike: hourly?.apparent_temperature?.[nowIndex] ?? cw.temperature,
    humidity: hourly?.relativehumidity_2m?.[nowIndex] ?? 0,
    windSpeed: cw.windspeed,
    weatherCode: cw.weathercode,
    description: WMO_CODES[cw.weathercode] ?? 'Unknown',
    unit,
  };

  await cacheSet(cacheKey, result, 1800);
  await incrementUsage(keyId);
  await queueStripeUsage(userId, plan);
  await queueUsageEvent({ keyId, userId, endpoint: 'weather', cached: false, latencyMs: Date.now() - start, statusCode: 200 });
  apiCallsTotal.inc({ endpoint: 'weather', plan, status: '200' });

  res.setHeader('X-Cache', 'MISS');
  res.json(result);
});
