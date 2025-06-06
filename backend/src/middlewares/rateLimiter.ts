import { Request, Response, NextFunction } from 'express';

interface RateLimit {
  count: number;
  lastReset: number;
}

const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute

const rateLimits = new Map<string, RateLimit>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const key = `${req.ip}-${req.path}`;
  const now = Date.now();
  const limit = rateLimits.get(key);

  if (!limit) {
    rateLimits.set(key, { count: 1, lastReset: now });
    return next();
  }

  if (now - limit.lastReset > WINDOW_MS) {
    limit.count = 1;
    limit.lastReset = now;
    return next();
  }

  if (limit.count >= MAX_REQUESTS) {
    res.status(429).json({ message: 'Too many requests, please try again later' });
    return;
  }

  limit.count++;
  next();
};