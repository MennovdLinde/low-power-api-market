export type Plan = 'free' | 'pro';

export interface ApiKeyContext {
  keyId: string;
  userId: string;
  plan: Plan;
}

export interface GeoResult {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
}

export interface CurrencyResult {
  from: string;
  to: string;
  rate: number;
  amount: number;
  converted: number;
  date: string;
  source: string;
}

export interface WeatherResult {
  lat: number;
  lon: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  unit: string;
}

export interface EmailResult {
  email: string;
  isValidSyntax: boolean;
  hasMx: boolean;
  isDisposable: boolean;
  domain: string;
}

declare global {
  namespace Express {
    interface Request {
      context: ApiKeyContext;
    }
  }
}
