import { NextResponse } from "next/server";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  hasNextPage: boolean;
  nextCursor?: string;
  total?: number;
}

export function apiSuccess<T>(
  data: T,
  options?: {
    status?: number;
    pagination?: PaginationMeta;
    headers?: Record<string, string>;
  }
): NextResponse {
  const body: ApiResponse<T> = {
    data,
    ...(options?.pagination ? { pagination: options.pagination } : {}),
  };

  return NextResponse.json(body, {
    status: options?.status ?? 200,
    headers: options?.headers,
  });
}

export function apiError(
  code: string,
  message: string,
  options?: {
    status?: number;
    details?: Record<string, unknown>;
    headers?: Record<string, string>;
  }
): NextResponse {
  // Never include stack traces or internal paths in API responses
  const body: ApiResponse<never> = {
    error: {
      code,
      message,
      ...(options?.details ? { details: options.details } : {}),
    },
  };

  return NextResponse.json(body, {
    status: options?.status ?? 400,
    headers: options?.headers,
  });
}

export function apiUnauthorized(message = "Authentication required"): NextResponse {
  return apiError("UNAUTHORIZED", message, { status: 401 });
}

export function apiForbidden(message = "Access denied"): NextResponse {
  return apiError("FORBIDDEN", message, { status: 403 });
}

export function apiNotFound(message = "Resource not found"): NextResponse {
  return apiError("NOT_FOUND", message, { status: 404 });
}

export function apiTooManyRequests(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return apiError("RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", {
    status: 429,
    headers: { "Retry-After": String(retryAfter) },
  });
}

export function apiInternalError(): NextResponse {
  return apiError("INTERNAL_ERROR", "An unexpected error occurred.", { status: 500 });
}

export function apiValidationError(
  fieldErrors: Record<string, string[]>
): NextResponse {
  return apiError("VALIDATION_ERROR", "Invalid request data.", {
    status: 422,
    details: { fieldErrors },
  });
}
