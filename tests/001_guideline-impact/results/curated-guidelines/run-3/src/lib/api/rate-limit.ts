interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (replace with Redis in production)
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 60_000); // Clean every minute

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export const RATE_LIMIT_PRESETS = {
  auth: { limit: 5, windowMs: 60_000 },    // 5 per minute
  write: { limit: 30, windowMs: 60_000 },   // 30 per minute
  read: { limit: 100, windowMs: 60_000 },   // 100 per minute
} as const;

export type RateLimitPreset = keyof typeof RATE_LIMIT_PRESETS;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function checkRateLimit(
  identifier: string,
  preset: RateLimitPreset | RateLimitConfig
): RateLimitResult {
  const config =
    typeof preset === "string" ? RATE_LIMIT_PRESETS[preset] : preset;
  const now = Date.now();
  const key = `${identifier}:${typeof preset === "string" ? preset : "custom"}`;

  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    store.set(key, entry);
  }

  entry.count += 1;

  const allowed = entry.count <= config.limit;
  const remaining = Math.max(0, config.limit - entry.count);

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    limit: config.limit,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) }),
  };
}
