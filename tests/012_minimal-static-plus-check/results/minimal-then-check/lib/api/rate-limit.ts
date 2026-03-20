const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  opts: { maxRequests: number; windowMs: number }
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { success: true, remaining: opts.maxRequests - 1 };
  }

  if (entry.count >= opts.maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: opts.maxRequests - entry.count };
}

export const RateLimits = {
  auth: { maxRequests: 5, windowMs: 60_000 },
  write: { maxRequests: 30, windowMs: 60_000 },
  read: { maxRequests: 100, windowMs: 60_000 },
};
