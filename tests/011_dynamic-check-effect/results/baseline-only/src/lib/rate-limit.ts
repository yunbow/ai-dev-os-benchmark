interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 60_000);

export function rateLimit(config: RateLimitConfig) {
  return {
    check(identifier: string): { success: boolean; remaining: number; resetAt: number } {
      const now = Date.now();
      const key = identifier;
      const entry = store.get(key);

      if (!entry || entry.resetAt <= now) {
        const resetAt = now + config.windowMs;
        store.set(key, { count: 1, resetAt });
        return { success: true, remaining: config.max - 1, resetAt };
      }

      if (entry.count >= config.max) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
      }

      entry.count++;
      return { success: true, remaining: config.max - entry.count, resetAt: entry.resetAt };
    },
  };
}

// Pre-configured rate limiters
export const authRateLimit = rateLimit({ windowMs: 60_000, max: 5 });
export const writeRateLimit = rateLimit({ windowMs: 60_000, max: 30 });
export const readRateLimit = rateLimit({ windowMs: 60_000, max: 100 });

export function getIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
