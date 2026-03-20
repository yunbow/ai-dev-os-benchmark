// In-memory rate limiter for development/single-instance
// Replace with Redis (Upstash) for production multi-instance deployments

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000);
}

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: options.maxRequests - 1, resetAt };
  }

  if (entry.count >= options.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Preset rate limit configurations
export const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 60_000 },
  write: { maxRequests: 30, windowMs: 60_000 },
  read: { maxRequests: 100, windowMs: 60_000 },
  invite: { maxRequests: 10, windowMs: 60_000 },
} as const;
