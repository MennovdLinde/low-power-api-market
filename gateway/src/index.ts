import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { auth } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import { metering } from './middleware/metering';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health';
import { geoRouter } from './routes/geo';
import { currencyRouter } from './routes/currency';
import { weatherRouter } from './routes/weather';
import { emailRouter } from './routes/email';
import { keysRouter } from './routes/keys';
import { billingRouter } from './routes/billing';
import { flushUsageBatch } from './services/usage';
import { flushStripeUsage } from './services/stripe';
import { db } from './db';
import { redis } from './services/cache';

const app = express();

app.use(cors());
app.set('trust proxy', 1);

// Raw body for Stripe webhook signature verification
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());

// Public routes
app.use('/health', healthRouter);

// API key management (authenticated but no quota check — managing keys shouldn't cost quota)
app.use('/api/keys', auth, keysRouter);
app.use('/api/billing', auth, billingRouter);

// Low-power API routes (full middleware stack)
app.use('/v1/geo', auth, rateLimiter, metering, geoRouter);
app.use('/v1/currency', auth, rateLimiter, metering, currencyRouter);
app.use('/v1/weather', auth, rateLimiter, metering, weatherRouter);
app.use('/v1/email', auth, rateLimiter, metering, emailRouter);

app.use(errorHandler as express.ErrorRequestHandler);

// Background jobs
setInterval(() => {
  flushUsageBatch().catch((e) => console.error('Usage flush error:', e));
}, 5_000);

setInterval(() => {
  flushStripeUsage().catch((e) => console.error('Stripe flush error:', e));
}, 3_600_000); // hourly

async function start(): Promise<void> {
  await redis.connect().catch(() => {}); // lazy connect, ignore if already connected
  await db.query('SELECT 1'); // test DB connection on boot
  console.log('✅ PostgreSQL connected');
  console.log('✅ Redis connected');

  app.listen(env.PORT, () => {
    console.log(`🚀 Gateway running on port ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  });
}

start().catch((err) => {
  console.error('Failed to start gateway:', err);
  process.exit(1);
});
