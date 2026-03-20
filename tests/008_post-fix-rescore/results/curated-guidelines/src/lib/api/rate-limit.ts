import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (for production use Redis)
const store = new Map<string, RateLimitEntry>();

function getClientKey(req: NextRequest, prefix: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${prefix}:${ip}`;
}

function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.max - 1, resetAt };
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetAt: entry.resetAt,
  };
}

export const RATE_LIMITS = {
  auth: { windowMs: 60_000, max: 5 },
  write: { windowMs: 60_000, max: 30 },
  read: { windowMs: 60_000, max: 100 },
} satisfies Record<string, RateLimitConfig>;

export type RateLimitType = keyof typeof RATE_LIMITS;

export function withRateLimit(type: RateLimitType) {
  return function rateLimit(
    handler: (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
  ) {
    return async function (
      req: NextRequest,
      ctx: { params: Promise<Record<string, string>> }
    ): Promise<NextResponse> {
      const config = RATE_LIMITS[type];
      const key = getClientKey(req, type);
      const result = checkRateLimit(key, config);

      const headers: Record<string, string> = {
        "X-RateLimit-Limit": String(config.max),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      };

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many requests. Please try again later.",
              details: [],
            },
          },
          { status: 429, headers }
        );
      }

      const response = await handler(req, ctx);
      Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    };
  };
}

export function applyRateLimit(
  req: NextRequest,
  type: RateLimitType
): { allowed: boolean; headers: Record<string, string>; response?: NextResponse } {
  const config = RATE_LIMITS[type];
  const key = getClientKey(req, type);
  const result = checkRateLimit(key, config);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(config.max),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.allowed) {
    return {
      allowed: false,
      headers,
      response: NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
            details: [],
          },
        },
        { status: 429, headers }
      ),
    };
  }

  return { allowed: true, headers };
}
