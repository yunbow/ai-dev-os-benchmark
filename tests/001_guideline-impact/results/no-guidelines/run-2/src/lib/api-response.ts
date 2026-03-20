import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details: unknown[] = []
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

export function apiValidationError(error: ZodError) {
  const details = error.errors.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  }));
  return apiError("VALIDATION_ERROR", "Validation failed", 422, details);
}

export function apiUnauthorized() {
  return apiError("UNAUTHORIZED", "Authentication required", 401);
}

export function apiForbidden() {
  return apiError("FORBIDDEN", "Insufficient permissions", 403);
}

export function apiNotFound(resource = "Resource") {
  return apiError("NOT_FOUND", `${resource} not found`, 404);
}

export function apiInternalError() {
  return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
}
