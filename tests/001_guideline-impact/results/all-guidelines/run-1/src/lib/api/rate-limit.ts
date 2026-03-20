interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60 * 1000;
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetTime < now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

export const RateLimitPresets = {
  auth: { limit: 5, windowMs: 60 * 1000 },
  write: { limit: 30, windowMs: 60 * 1000 },
  read: { limit: 100, windowMs: 60 * 1000 },
  strict: { limit: 5, windowMs: 60 * 1000 },
} as const;

export type RateLimitPreset = keyof typeof RateLimitPresets;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export function checkRateLimit(
  identifier: string,
  preset: RateLimitPreset | { limit: number; windowMs: number }
): RateLimitResult {
  const config =
    typeof preset === "string" ? RateLimitPresets[preset] : preset;
  const now = Date.now();
  const key = `${identifier}:${config.limit}:${config.windowMs}`;

  let entry = store.get(key);

  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + config.windowMs };
    store.set(key, entry);
  }

  const allowed = entry.count < config.limit;
  if (allowed) {
    entry.count++;
  }

  return {
    allowed,
    limit: config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    resetTime: Math.ceil(entry.resetTime / 1000),
    retryAfter: allowed
      ? undefined
      : Math.ceil((entry.resetTime - now) / 1000),
  };
}

export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp;

  return "unknown";
}

export function setRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
): void {
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.resetTime.toString());
  if (result.retryAfter) {
    headers.set("Retry-After", result.retryAfter.toString());
  }
}
