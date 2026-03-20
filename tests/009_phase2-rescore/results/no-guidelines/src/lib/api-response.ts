import { NextResponse } from "next/server";

export type ApiError = {
  code: string;
  message: string;
  details?: unknown[];
};

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: ApiError, status: number) {
  return NextResponse.json({ error }, { status });
}

export function apiValidationError(details: unknown[]) {
  return apiError(
    { code: "VALIDATION_ERROR", message: "Validation failed", details },
    422,
  );
}

export function apiNotFound(message = "Resource not found") {
  return apiError({ code: "NOT_FOUND", message, details: [] }, 404);
}

export function apiForbidden(message = "Insufficient permissions") {
  return apiError({ code: "FORBIDDEN", message, details: [] }, 403);
}

export function apiUnauthorized(message = "Authentication required") {
  return apiError({ code: "UNAUTHORIZED", message, details: [] }, 401);
}

export function apiInternalError() {
  return apiError(
    { code: "INTERNAL_ERROR", message: "An unexpected error occurred", details: [] },
    500,
  );
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function actionError(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { success: false, error, fieldErrors };
}
