import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown[];
}

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function paginatedResponse<T>(
  data: T[],
  nextCursor: string | null,
  hasMore: boolean,
  status = 200
): NextResponse {
  return NextResponse.json({ data, nextCursor, hasMore }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown[]
): NextResponse {
  const error: ApiError = { code, message };
  if (details && details.length > 0) {
    error.details = details;
  }
  return NextResponse.json({ error }, { status });
}

export function validationErrorResponse(error: ZodError): NextResponse {
  const details = error.errors.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  }));
  return errorResponse("VALIDATION_ERROR", "Validation failed", 400, details);
}

export function unauthorizedResponse(): NextResponse {
  return errorResponse("UNAUTHORIZED", "Authentication required", 401);
}

export function forbiddenResponse(): NextResponse {
  return errorResponse("FORBIDDEN", "You do not have permission to perform this action", 403);
}

export function notFoundResponse(resource = "Resource"): NextResponse {
  return errorResponse("NOT_FOUND", `${resource} not found`, 404);
}

export function rateLimitResponse(resetAt: number): NextResponse {
  const response = errorResponse(
    "RATE_LIMIT_EXCEEDED",
    "Too many requests, please try again later",
    429
  );
  response.headers.set("Retry-After", Math.ceil((resetAt - Date.now()) / 1000).toString());
  return response;
}

export function internalErrorResponse(): NextResponse {
  return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
}
