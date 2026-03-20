import { NextRequest, NextResponse } from "next/server";

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitStore>();

export function rateLimit(options: { limit: number; windowMs: number }) {
  return function check(req: NextRequest): NextResponse | null {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + options.windowMs };
      store.set(key, entry);
    }

    entry.count++;

    if (entry.count > options.limit) {
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
            "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
          },
        },
      );
    }

    return null;
  };
}

export const authRateLimit = rateLimit({ limit: 5, windowMs: 60_000 });
export const writeRateLimit = rateLimit({ limit: 30, windowMs: 60_000 });
export const readRateLimit = rateLimit({ limit: 100, windowMs: 60_000 });
