// Simple in-memory rate limiter (use Redis/Upstash in production multi-instance)
const store = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  key: string,
  opts: { maxRequests: number; windowMs: number },
): Promise<{ success: boolean; remaining: number }> {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { success: true, remaining: opts.maxRequests - 1 };
  }

  if (entry.count >= opts.maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: opts.maxRequests - entry.count };
}
