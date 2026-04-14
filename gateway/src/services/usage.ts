import { redis } from './cache';
import { db } from '../db';

const PLAN_LIMITS: Record<string, number> = {
  free: 1_000_000,
  pro: 100_000_000,
};

function monthKey(keyId: string): string {
  const now = new Date();
  return `lpa:quota:${keyId}:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function getMonthlyUsage(keyId: string): Promise<number> {
  const val = await redis.get(monthKey(keyId));
  return val ? parseInt(val, 10) : 0;
}

export async function incrementUsage(keyId: string): Promise<void> {
  await redis.incr(monthKey(keyId));
}

export async function isOverQuota(keyId: string, plan: string): Promise<boolean> {
  const usage = await getMonthlyUsage(keyId);
  return usage >= (PLAN_LIMITS[plan] ?? PLAN_LIMITS.free);
}

// Batch usage events into a Redis list, flushed to Postgres every 5s
const BATCH_KEY_PREFIX = 'lpa:batch:';

export interface UsageEvent {
  keyId: string;
  userId: string;
  endpoint: string;
  cached: boolean;
  latencyMs: number;
  statusCode: number;
}

export async function queueUsageEvent(event: UsageEvent): Promise<void> {
  await redis.lpush(BATCH_KEY_PREFIX + event.keyId, JSON.stringify(event));
}

export async function flushUsageBatch(): Promise<void> {
  const keys = await redis.keys(BATCH_KEY_PREFIX + '*');
  if (keys.length === 0) return;

  const rows: UsageEvent[] = [];
  for (const key of keys) {
    const items = await redis.lrange(key, 0, 99);
    if (items.length === 0) continue;
    await redis.ltrim(key, items.length, -1);
    rows.push(...items.map((i) => JSON.parse(i) as UsageEvent));
  }

  if (rows.length === 0) return;

  const values = rows
    .map((_, i) => {
      const base = i * 6;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
    })
    .join(', ');

  const params = rows.flatMap((r) => [
    r.keyId,
    r.userId,
    r.endpoint,
    r.cached,
    r.latencyMs,
    r.statusCode,
  ]);

  await db.query(
    `INSERT INTO usage_events (key_id, user_id, endpoint, cached, latency_ms, status_code)
     VALUES ${values}`,
    params
  );
}
