import crypto from 'crypto';
import { db } from '../db';
import { redis } from './cache';
import type { ApiKeyContext, Plan } from '../types';

const KEY_TTL = 30; // seconds — short so revocations propagate quickly

function hashKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = 'lpa_live_' + crypto.randomBytes(24).toString('hex');
  return { raw, hash: hashKey(raw), prefix: raw.slice(0, 16) };
}

export async function lookupApiKey(rawKey: string): Promise<ApiKeyContext | null> {
  const hash = hashKey(rawKey);
  const cacheKey = `lpa:key:${hash}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (!parsed.isActive) return null;
    return { keyId: parsed.keyId, userId: parsed.userId, plan: parsed.plan as Plan };
  }

  const result = await db.query(
    `SELECT ak.id, ak.user_id, u.plan, ak.is_active
     FROM api_keys ak
     JOIN users u ON u.id = ak.user_id
     WHERE ak.key_hash = $1`,
    [hash]
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  await redis.set(
    cacheKey,
    JSON.stringify({ keyId: row.id, userId: row.user_id, plan: row.plan, isActive: row.is_active }),
    'EX',
    KEY_TTL
  );

  if (!row.is_active) return null;
  return { keyId: row.id, userId: row.user_id, plan: row.plan as Plan };
}

export async function invalidateKeyCache(hash: string): Promise<void> {
  await redis.del(`lpa:key:${hash}`);
}
