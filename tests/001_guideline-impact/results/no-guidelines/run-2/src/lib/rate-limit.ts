import { LRUCache } from "lru-cache";
import { NextRequest, NextResponse } from "next/server";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

const caches = new Map<string, LRUCache<string, number[]>>();

function getCache(windowMs: number) {
  const key = String(windowMs);
  if (!caches.has(key)) {
    caches.set(
      key,
      new LRUCache<string, number[]>({ max: 10000, ttl: windowMs })
    );
  }
  return caches.get(key)!;
}

export function rateLimit(options: RateLimitOptions) {
  const { limit, windowMs } = options;
  const cache = getCache(windowMs);

  return function check(identifier: string): { success: boolean; remaining: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = (cache.get(identifier) ?? []).filter((t) => t > windowStart);
    timestamps.push(now);
    cache.set(identifier, timestamps);

    const remaining = Math.max(0, limit - timestamps.length);
    return { success: timestamps.length <= limit, remaining };
  };
}

export const authRateLimit = rateLimit({ limit: 5, windowMs: 60_000 });
export const writeRateLimit = rateLimit({ limit: 30, windowMs: 60_000 });
export const readRateLimit = rateLimit({ limit: 100, windowMs: 60_000 });

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function rateLimitResponse(remaining: number = 0): NextResponse {
  return NextResponse.json(
    { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again later." } },
    {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Remaining": String(remaining),
      },
    }
  );
}
