import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const httpDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['route', 'plan', 'status'],
  buckets: [5, 10, 25, 50, 100, 250, 500],
  registers: [registry],
});

export const cacheHits = new Counter({
  name: 'cache_hit_total',
  help: 'Number of cache hits per endpoint',
  labelNames: ['endpoint'],
  registers: [registry],
});

export const cacheMisses = new Counter({
  name: 'cache_miss_total',
  help: 'Number of cache misses per endpoint',
  labelNames: ['endpoint'],
  registers: [registry],
});

export const apiCallsTotal = new Counter({
  name: 'api_calls_total',
  help: 'Total API calls by endpoint, plan, and status',
  labelNames: ['endpoint', 'plan', 'status'],
  registers: [registry],
});

export const rateLimitRejections = new Counter({
  name: 'rate_limit_rejections_total',
  help: 'Rate limit rejections (429s)',
  labelNames: ['endpoint', 'plan'],
  registers: [registry],
});

export const quotaExhaustion = new Counter({
  name: 'quota_exhaustion_total',
  help: 'Quota exhaustion events (402s)',
  labelNames: ['plan'],
  registers: [registry],
});

export const activeApiKeys = new Gauge({
  name: 'active_api_keys_total',
  help: 'Number of active API keys per plan',
  labelNames: ['plan'],
  registers: [registry],
});

export const upstreamDuration = new Histogram({
  name: 'upstream_request_duration_ms',
  help: 'Upstream provider request duration in milliseconds',
  labelNames: ['provider', 'endpoint'],
  buckets: [5, 15, 30, 50, 100, 250],
  registers: [registry],
});

export const rustServiceDuration = new Histogram({
  name: 'rust_service_duration_ms',
  help: 'Rust service call duration in milliseconds',
  labelNames: ['service'],
  buckets: [1, 2, 5, 10, 25],
  registers: [registry],
});
