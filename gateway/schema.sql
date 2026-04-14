-- Low-Power API Marketplace — PostgreSQL Schema
-- Run this in your Supabase SQL editor

-- Users
CREATE TABLE IF NOT EXISTS users (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                       TEXT UNIQUE NOT NULL,
  stripe_customer_id          TEXT,
  stripe_subscription_item_id TEXT,
  plan                        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API Keys (hashed — raw key is never stored)
CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash    TEXT UNIQUE NOT NULL,
  key_prefix  TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT 'default',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  last_used   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys(key_hash);

-- Plans (static config, seeded below)
CREATE TABLE IF NOT EXISTS plans (
  name               TEXT PRIMARY KEY,
  monthly_req_limit  BIGINT NOT NULL,
  rpm_limit          INT NOT NULL,
  price_per_1k_req   NUMERIC(8,6),
  stripe_price_id    TEXT
);
INSERT INTO plans VALUES ('free', 1000000, 60, NULL, NULL)
  ON CONFLICT (name) DO NOTHING;
INSERT INTO plans VALUES ('pro', 100000000, 600, 0.001000, NULL)
  ON CONFLICT (name) DO NOTHING;

-- Usage Events (partitioned by month for scale)
CREATE TABLE IF NOT EXISTS usage_events (
  id          BIGSERIAL,
  key_id      UUID NOT NULL REFERENCES api_keys(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  endpoint    TEXT NOT NULL CHECK (endpoint IN ('geo', 'currency', 'weather', 'email')),
  cached      BOOLEAN NOT NULL,
  latency_ms  INT NOT NULL,
  status_code INT NOT NULL,
  ts          TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (ts);

-- April 2026 partition (add a new one each month)
CREATE TABLE IF NOT EXISTS usage_events_2026_04 PARTITION OF usage_events
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS usage_events_2026_05 PARTITION OF usage_events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS usage_events_2026_06 PARTITION OF usage_events
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- Billing Events (Stripe webhook log)
CREATE TABLE IF NOT EXISTS billing_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type      TEXT NOT NULL,
  amount_cents    INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dashboard query helpers (not views — just comments for reference)
-- Today's calls by hour:
--   SELECT date_trunc('hour', ts) AS hour, COUNT(*) AS calls, endpoint
--   FROM usage_events WHERE key_id = $1 AND ts >= CURRENT_DATE
--   GROUP BY hour, endpoint ORDER BY hour;

-- Monthly totals by endpoint:
--   SELECT endpoint, COUNT(*) AS calls, AVG(latency_ms) AS avg_latency,
--          SUM(CASE WHEN cached THEN 1 ELSE 0 END)::float / COUNT(*) AS cache_hit_rate
--   FROM usage_events WHERE user_id = $1
--   AND ts >= date_trunc('month', now())
--   GROUP BY endpoint;
