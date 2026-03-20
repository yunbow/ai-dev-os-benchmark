// In-memory rate limiter for development/single-instance deployments.
// For production multi-instance deployments, replace with Redis (Upstash).

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + opts.windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: opts.maxRequests - 1, resetAt };
  }

  if (entry.count >= opts.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    success: true,
    remaining: opts.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Preset configurations
export const RateLimitPresets = {
  auth: { maxRequests: 10, windowMs: 60_000 }, // 10/min
  generation: { maxRequests: 30, windowMs: 3_600_000 }, // 30/hour
  api: { maxRequests: 100, windowMs: 60_000 }, // 100/min
  strict: { maxRequests: 5, windowMs: 60_000 }, // 5/min
} as const;
