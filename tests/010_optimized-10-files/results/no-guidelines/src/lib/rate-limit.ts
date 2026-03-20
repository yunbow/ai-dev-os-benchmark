interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  },
  60 * 1000 // Clean every minute
);

export function createRateLimiter(
  limit: number,
  windowMs: number
): (key: string) => RateLimitResult {
  return (key: string): RateLimitResult => {
    const now = Date.now();
    const storeKey = `${limit}:${windowMs}:${key}`;
    const entry = store.get(storeKey);

    if (!entry || entry.resetAt <= now) {
      store.set(storeKey, { count: 1, resetAt: now + windowMs });
      return { success: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
      return { success: false, remaining: 0 };
    }

    entry.count += 1;
    return { success: true, remaining: limit - entry.count };
  };
}

// 5 requests per minute for auth endpoints
export const authLimiter = createRateLimiter(5, 60 * 1000);

// 30 requests per minute for write operations
export const writeLimiter = createRateLimiter(30, 60 * 1000);

// 100 requests per minute for read operations
export const readLimiter = createRateLimiter(100, 60 * 1000);
