import { NextRequest } from "next/server";

interface RateLimitOptions {
  windowMs: number; // time window in milliseconds
  max: number; // max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production for distributed systems)
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, 60 * 1000); // cleanup every minute
}

export function rateLimit(options: RateLimitOptions) {
  return {
    check: (
      identifier: string
    ): { success: boolean; remaining: number; resetTime: number } => {
      const now = Date.now();
      const key = identifier;
      const entry = store.get(key);

      if (!entry || now > entry.resetTime) {
        const newEntry: RateLimitEntry = {
          count: 1,
          resetTime: now + options.windowMs,
        };
        store.set(key, newEntry);
        return {
          success: true,
          remaining: options.max - 1,
          resetTime: newEntry.resetTime,
        };
      }

      if (entry.count >= options.max) {
        return {
          success: false,
          remaining: 0,
          resetTime: entry.resetTime,
        };
      }

      entry.count += 1;
      return {
        success: true,
        remaining: options.max - entry.count,
        resetTime: entry.resetTime,
      };
    },
  };
}

export function getIdentifier(request: NextRequest, suffix: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${ip}:${suffix}`;
}

// Pre-configured rate limiters
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
});

export const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
});

export const readRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
});

export function rateLimitResponse(resetTime: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
        details: [],
      },
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
        "X-RateLimit-Reset": new Date(resetTime).toISOString(),
      },
    }
  );
}
