import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function invalidBodyResponse() {
  return apiError("INVALID_BODY", "Request body must be valid JSON", 400);
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown[]
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

export function zodErrorResponse(error: ZodError) {
  const details = error.errors.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  }));
  return apiError("VALIDATION_ERROR", "Validation failed", 400, details);
}

export function unauthorizedResponse() {
  return apiError("UNAUTHORIZED", "Authentication required", 401);
}

export function forbiddenResponse() {
  return apiError("FORBIDDEN", "Insufficient permissions", 403);
}

export function notFoundResponse(resource = "Resource") {
  return apiError("NOT_FOUND", `${resource} not found`, 404);
}

export function rateLimitResponse(resetAt: number) {
  const res = apiError("RATE_LIMIT_EXCEEDED", "Too many requests", 429);
  res.headers.set("Retry-After", String(Math.ceil((resetAt - Date.now()) / 1000)));
  return res;
}
