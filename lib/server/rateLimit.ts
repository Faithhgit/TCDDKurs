type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = memoryStore.get(key);

  if (!current || current.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: windowMs };
  }

  if (current.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: current.resetAt - now };
  }

  current.count += 1;
  memoryStore.set(key, current);
  return { ok: true, remaining: limit - current.count, retryAfterMs: current.resetAt - now };
}
