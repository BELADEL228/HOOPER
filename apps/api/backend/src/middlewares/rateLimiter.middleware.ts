import { Request, Response, NextFunction } from 'express';
import { AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS } from '../config/env';

const authAttempts = new Map<string, { count: number; resetAt: number }>();

export const rateLimitAuth = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const current = authAttempts.get(key);

  if (!current || now >= current.resetAt) {
    authAttempts.set(key, { count: 1, resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  if (current.count >= AUTH_RATE_LIMIT_MAX) {
    res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' });
    return;
  }

  current.count += 1;
  next();
};
