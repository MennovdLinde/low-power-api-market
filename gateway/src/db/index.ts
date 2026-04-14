import { Pool } from 'pg';
import { env } from '../config/env';

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

db.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});
