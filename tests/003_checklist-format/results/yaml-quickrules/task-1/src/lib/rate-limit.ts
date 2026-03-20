/**
 * SEC-10: IP-based rate limiting
 * Development/single instance: in-memory store
 * Production/multiple instances: swap for Redis (Upstash)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Presets from security guidelines (Section 3.2)
const PRESETS: Record<string, { limit: number; windowMs: number }> = {
  auth:       { limit: 10,  windowMs: 60 * 1000 },        // 10/min
  generation: { limit: 30,  windowMs: 60 * 60 * 1000 },   // 30/hour
  api:        { limit: 100, windowMs: 60 * 1000 },         // 100/min
  strict:     { limit: 5,   windowMs: 60 * 1000 },         // 5/min
};

const store = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfter: number; // seconds
}

export async function rateLimit(
  preset: keyof typeof PRESETS,
  identifier: string
): Promise<RateLimitResult> {
  const { limit, windowMs } = PRESETS[preset] ?? PRESETS.api;
  const key = `${preset}:${identifier}`;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { success: true, limit, remaining: limit - 1, retryAfter: 0 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { success: false, limit, remaining: 0, retryAfter };
  }

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    retryAfter: 0,
  };
}
