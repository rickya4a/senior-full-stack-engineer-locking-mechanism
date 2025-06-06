import { Request, Response, NextFunction } from 'express';

interface RateLimit {
  count: number;
  lastReset: number;
  failedAttempts: number;
}

const AUTH_WINDOW_MS = 300000; // 5 minutes
const MAX_AUTH_ATTEMPTS = 5; // 5 attempts per 5 minutes per IP
const LOCKOUT_DURATION_MS = 900000; // 15 minutes lockout after too many failed attempts

const authAttempts = new Map<string, RateLimit>();

export const authRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const key = `${req.ip}-auth`;
  const now = Date.now();
  const limit = authAttempts.get(key);

  if (!limit) {
    authAttempts.set(key, { count: 1, lastReset: now, failedAttempts: 0 });
    return next();
  }

  // Check if user is in lockout period
  if (limit.failedAttempts >= MAX_AUTH_ATTEMPTS) {
    const lockoutEnd = limit.lastReset + LOCKOUT_DURATION_MS;
    if (now < lockoutEnd) {
      res.status(429).json({
        message: 'Account temporarily locked due to too many failed attempts',
        retryAfter: Math.ceil((lockoutEnd - now) / 1000)
      });
      return;
    } else {
      // Reset after lockout period
      limit.failedAttempts = 0;
      limit.count = 1;
      limit.lastReset = now;
      return next();
    }
  }

  if (now - limit.lastReset > AUTH_WINDOW_MS) {
    limit.count = 1;
    limit.lastReset = now;
    return next();
  }

  if (limit.count >= MAX_AUTH_ATTEMPTS) {
    limit.failedAttempts++;
    res.status(429).json({
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil((AUTH_WINDOW_MS - (now - limit.lastReset)) / 1000)
    });
    return;
  }

  limit.count++;
  next();
};