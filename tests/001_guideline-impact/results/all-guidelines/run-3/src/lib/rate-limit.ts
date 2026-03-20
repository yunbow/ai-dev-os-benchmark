// In-memory rate limiter (sliding window)
// For production with multiple instances, replace with Redis-backed implementation

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every minute
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

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}:${config.limit}:${config.windowMs}`;

  let entry = store.get(key);

  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
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
    retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000),
  };
}

// ─── Preset Configurations (from PRD) ─────────────────────────────────────────

export const RateLimitPresets = {
  /** Authentication endpoints: 5 requests/minute */
  auth: { limit: 5, windowMs: 60 * 1000 },
  /** Write operations: 30 requests/minute */
  write: { limit: 30, windowMs: 60 * 1000 },
  /** Read operations: 100 requests/minute */
  read: { limit: 100, windowMs: 60 * 1000 },
} as const;

export type RateLimitPreset = keyof typeof RateLimitPresets;

export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp;

  return "unknown";
}
