import { Request, Response, NextFunction } from 'express';

interface RateLimit {
  count: number;
  lastReset: number;
}

const LOCK_WINDOW_MS = 60000; // 1 minute
const MAX_LOCK_ATTEMPTS = 10; // 10 lock attempts per minute per user

const lockAttempts = new Map<string, RateLimit>();

export const lockRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const key = `${userId}-lock-attempts`;
  const now = Date.now();
  const limit = lockAttempts.get(key);

  if (!limit) {
    lockAttempts.set(key, { count: 1, lastReset: now });
    return next();
  }

  if (now - limit.lastReset > LOCK_WINDOW_MS) {
    limit.count = 1;
    limit.lastReset = now;
    return next();
  }

  if (limit.count >= MAX_LOCK_ATTEMPTS) {
    res.status(429).json({
      message: 'Too many lock attempts. Please wait before trying again.',
      retryAfter: Math.ceil((LOCK_WINDOW_MS - (now - limit.lastReset)) / 1000)
    });
    return;
  }

  limit.count++;
  next();
};