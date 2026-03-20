// Memory-based rate limiter for development
// In production, use Redis

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Presets
export const RateLimitPresets = {
  auth: { maxRequests: 5, windowMs: 60 * 1000 },      // 5/min
  write: { maxRequests: 30, windowMs: 60 * 1000 },    // 30/min
  read: { maxRequests: 100, windowMs: 60 * 1000 },    // 100/min
} as const;

type RateLimitPreset = keyof typeof RateLimitPresets;

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
  },
  5 * 60 * 1000,
); // Every 5 minutes

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfter?: number;
}

export function checkRateLimit(
  identifier: string,
  preset: RateLimitPreset | RateLimitConfig,
): RateLimitResult {
  const config =
    typeof preset === "string" ? RateLimitPresets[preset] : preset;
  const key = `${typeof preset === "string" ? preset : "custom"}:${identifier}`;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    store.set(key, entry);
  }

  entry.count++;

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const success = entry.count <= config.maxRequests;

  return {
    success,
    remaining,
    limit: config.maxRequests,
    resetAt: entry.resetAt,
    retryAfter: success
      ? undefined
      : Math.ceil((entry.resetAt - now) / 1000),
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (result.retryAfter !== undefined) {
    headers["Retry-After"] = String(result.retryAfter);
  }

  return headers;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
