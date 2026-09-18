import dotenv from 'dotenv';

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = Number(process.env.API_PORT || process.env.PORT || 5000);

if (NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

export const JWT_SECRET = process.env.JWT_SECRET || (
  NODE_ENV === 'production'
    ? (() => { throw new Error('JWT_SECRET doit être défini en production.'); })()
    : 'fire_stone_local_only_secret_change_me'
);

export const CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const AUTH_RATE_LIMIT_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
export const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX || 20);
// A logo is transferred as a base64 data URL by the club administration UI.
// Base64 increases the original file size by roughly one third.
export const MAX_JSON_BODY_SIZE = process.env.MAX_JSON_BODY_SIZE || '10mb';
export const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
