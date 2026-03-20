import { NextResponse } from "next/server";

export interface ApiError {
  code: string;
  message: string;
  details: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function apiPaginated<T>(
  data: T[],
  nextCursor: string | null,
  hasMore: boolean
): NextResponse {
  return NextResponse.json({
    data,
    nextCursor,
    hasMore,
  });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details: string[] = []
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        // Never include stack traces in responses
        details,
      } satisfies ApiError,
    },
    { status }
  );
}

export function apiUnauthorized(
  message = "Unauthorized"
): NextResponse {
  return apiError("UNAUTHORIZED", message, 401);
}

export function apiForbidden(message = "Forbidden"): NextResponse {
  return apiError("FORBIDDEN", message, 403);
}

export function apiNotFound(resource = "Resource"): NextResponse {
  return apiError("NOT_FOUND", `${resource} not found`, 404);
}

export function apiBadRequest(
  message: string,
  details: string[] = []
): NextResponse {
  return apiError("BAD_REQUEST", message, 400, details);
}

export function apiInternalError(): NextResponse {
  return apiError(
    "INTERNAL_SERVER_ERROR",
    "An unexpected error occurred",
    500
  );
}
