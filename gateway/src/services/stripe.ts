import Stripe from 'stripe';
import { env } from '../config/env';
import { redis } from './cache';
import { db } from '../db';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

function deltaKey(userId: string, hour: string): string {
  return `lpa:stripe:delta:${userId}:${hour}`;
}

function currentHour(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
}

function previousHour(): string {
  const d = new Date(Date.now() - 3_600_000);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
}

export async function queueStripeUsage(userId: string, plan: string): Promise<void> {
  if (plan !== 'pro') return;
  await redis.incr(deltaKey(userId, currentHour()));
}

// Called hourly via setInterval in index.ts
export async function flushStripeUsage(): Promise<void> {
  const result = await db.query(
    `SELECT id, stripe_subscription_item_id FROM users WHERE plan = 'pro' AND stripe_subscription_item_id IS NOT NULL`
  );

  for (const user of result.rows) {
    const key = deltaKey(user.id, previousHour());
    const delta = await redis.getdel(key);
    if (!delta || delta === '0') continue;

    await stripe.subscriptionItems.createUsageRecord(user.stripe_subscription_item_id, {
      quantity: parseInt(delta, 10),
      action: 'increment',
    });
  }
}
