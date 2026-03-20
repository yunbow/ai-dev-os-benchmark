/**
 * Rate limiting utility.
 *
 * Development / single instance: in-memory store.
 * Production / multiple instances: swap `store` for a Redis (Upstash) adapter.
 *
 * Presets (from security guidelines):
 *   auth       – 10  requests / 60 s   (login, password reset)
 *   generation – 30  requests / 3600 s (AI generation)
 *   api        – 100 requests / 60 s   (general API)
 *   strict     – 5   requests / 60 s   (critical operations)
 */

type Preset = "auth" | "generation" | "api" | "strict";

interface PresetConfig {
  limit: number;
  windowMs: number;
}

const PRESETS: Record<Preset, PresetConfig> = {
  auth:       { limit: 10,  windowMs: 60 * 1000 },
  generation: { limit: 30,  windowMs: 60 * 60 * 1000 },
  api:        { limit: 100, windowMs: 60 * 1000 },
  strict:     { limit: 5,   windowMs: 60 * 1000 },
};

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (single instance / dev only).
const store = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfter: number; // seconds until reset (only meaningful when success=false)
}

export async function rateLimit(
  preset: Preset,
  identifier: string
): Promise<RateLimitResult> {
  const { limit, windowMs } = PRESETS[preset];
  const key = `${preset}:${identifier}`;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
  }

  entry.count += 1;
  store.set(key, entry);

  const remaining = Math.max(0, limit - entry.count);
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > limit) {
    return { success: false, limit, remaining: 0, retryAfter };
  }

  return { success: true, limit, remaining, retryAfter: 0 };
}
