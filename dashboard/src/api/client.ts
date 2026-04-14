import axios from 'axios';

const BASE_URL = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:3000';

export const api = axios.create({ baseURL: BASE_URL });

export function setApiKey(key: string) {
  api.defaults.headers.common['X-API-Key'] = key;
}

export interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  last_used: string | null;
  created_at: string;
}

export interface UsageStat {
  endpoint: string;
  calls: number;
  avg_latency: number;
  cache_hit_rate: number;
}

export interface DailyUsage {
  day: string;
  geo: number;
  currency: number;
  weather: number;
  email: number;
}
