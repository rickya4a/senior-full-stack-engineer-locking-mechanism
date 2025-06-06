interface RateLimit {
  count: number;
  lastReset: number;
}

const WS_WINDOW_MS = 1000; // 1 second
const MAX_WS_MESSAGES = 20; // 20 messages per second per user

const wsMessageCounts = new Map<string, RateLimit>();

export const isRateLimited = (userId: string): boolean => {
  const now = Date.now();
  const limit = wsMessageCounts.get(userId);

  if (!limit) {
    wsMessageCounts.set(userId, { count: 1, lastReset: now });
    return false;
  }

  if (now - limit.lastReset > WS_WINDOW_MS) {
    limit.count = 1;
    limit.lastReset = now;
    return false;
  }

  if (limit.count >= MAX_WS_MESSAGES) {
    return true;
  }

  limit.count++;
  return false;
};