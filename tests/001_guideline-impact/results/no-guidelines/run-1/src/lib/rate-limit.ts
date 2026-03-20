// In-memory rate limiter (replace with Redis in production for multi-instance deployments)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

type RateLimitCategory = "auth" | "write" | "read";

const LIMITS: Record<RateLimitCategory, { max: number; windowMs: number }> = {
  auth: { max: 5, windowMs: 60_000 },
  write: { max: 30, windowMs: 60_000 },
  read: { max: 100, windowMs: 60_000 },
};

export function checkRateLimit(
  identifier: string,
  category: RateLimitCategory
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${category}:${identifier}`;
  const limit = LIMITS[category];
  const now = Date.now();

  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true, remaining: limit.max - 1, resetAt: now + limit.windowMs };
  }

  if (entry.count >= limit.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit.max - entry.count, resetAt: entry.resetAt };
}

// Periodically clean up expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) rateLimitMap.delete(key);
  }
}, 60_000);
