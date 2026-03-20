import { NextResponse } from "next/server";

// ─── Standard API Error Format ────────────────────────────────────────────────

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

// ─── Success Response ─────────────────────────────────────────────────────────

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

// ─── Error Responses ──────────────────────────────────────────────────────────

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: ApiErrorDetail[]
): NextResponse {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

export function apiValidationError(
  fieldErrors: Record<string, string[]>
): NextResponse {
  const details: ApiErrorDetail[] = Object.entries(fieldErrors).flatMap(
    ([field, messages]) => messages.map((message) => ({ field, message }))
  );
  return apiError("VALIDATION_ERROR", "Validation failed", 422, details);
}

export function apiUnauthorized(message = "Authentication required"): NextResponse {
  return apiError("UNAUTHORIZED", message, 401);
}

export function apiForbidden(message = "Insufficient permissions"): NextResponse {
  return apiError("FORBIDDEN", message, 403);
}

export function apiNotFound(entity = "Resource"): NextResponse {
  return apiError("NOT_FOUND", `${entity} not found`, 404);
}

export function apiRateLimited(retryAfter?: number): NextResponse {
  const response = apiError("RATE_LIMITED", "Too many requests. Please try again later.", 429);
  if (retryAfter) {
    response.headers.set("Retry-After", String(retryAfter));
  }
  return response;
}

export function apiInternalError(): NextResponse {
  return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
}

// ─── Rate Limit Headers ───────────────────────────────────────────────────────

export function withRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(resetTime));
  return response;
}
