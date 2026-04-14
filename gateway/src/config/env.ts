import 'dotenv/config';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL: requireEnv('DATABASE_URL'),
  REDIS_URL: requireEnv('REDIS_URL'),
  STRIPE_SECRET_KEY: requireEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: requireEnv('STRIPE_WEBHOOK_SECRET'),
  RUST_GEO_URL: process.env.RUST_GEO_URL ?? 'http://localhost:3001',
  RUST_CURRENCY_URL: process.env.RUST_CURRENCY_URL ?? 'http://localhost:3002',
};
