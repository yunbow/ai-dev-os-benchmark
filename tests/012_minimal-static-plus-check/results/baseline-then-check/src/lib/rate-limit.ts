import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

// In-memory store for rate limiting
// In production, use Redis
const store = new Map<string, { count: number; resetAt: number }>();

function getClientId(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}

export function rateLimit(config: RateLimitConfig) {
  return function checkRateLimit(req: NextRequest): NextResponse | null {
    const clientId = getClientId(req);
    const now = Date.now();
    const key = `${clientId}:${req.nextUrl.pathname}`;

    const record = store.get(key);

    if (!record || now > record.resetAt) {
      store.set(key, { count: 1, resetAt: now + config.windowMs });
      return null;
    }

    if (record.count >= config.limit) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
            details: [],
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(record.resetAt / 1000)),
          },
        }
      );
    }

    record.count++;
    return null;
  };
}

// Pre-configured rate limiters
export const authRateLimit = rateLimit({ limit: 5, windowMs: 60 * 1000 });
export const writeRateLimit = rateLimit({ limit: 30, windowMs: 60 * 1000 });
export const readRateLimit = rateLimit({ limit: 100, windowMs: 60 * 1000 });

// Cleanup old entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (now > value.resetAt) {
        store.delete(key);
      }
    }
  }, 60 * 1000);
}
