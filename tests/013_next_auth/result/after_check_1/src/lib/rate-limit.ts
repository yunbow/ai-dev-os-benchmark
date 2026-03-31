interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export async function checkRateLimit(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number }
): Promise<{ success: boolean }> {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (entry.count >= maxRequests) {
    return { success: false };
  }

  entry.count += 1;
  return { success: true };
}
