interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const requests = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const record = requests.get(identifier);

  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    requests.set(identifier, { count: 1, resetTime });
    return { success: true, remaining: limit - 1, resetTime, limit };
  }

  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
      limit,
    };
  }

  record.count++;
  requests.set(identifier, record);

  return {
    success: true,
    remaining: limit - record.count,
    resetTime: record.resetTime,
    limit,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    ...(result.success ? {} : { "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString() }),
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requests.entries()) {
    if (now > value.resetTime) {
      requests.delete(key);
    }
  }
}, 60000);
