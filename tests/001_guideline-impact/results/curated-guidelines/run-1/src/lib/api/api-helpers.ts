import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { auth } from "@/lib/auth/auth";

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export function apiError(code: string, message: string, status: number, details?: unknown[]) {
  const body: ApiError = { error: { code, message, ...(details ? { details } : {}) } };
  return NextResponse.json(body, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export async function requireApiAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { userId: null, response: apiError("UNAUTHORIZED", "Authentication required", 401) };
  }
  return { userId: session.user.id, response: null };
}

export function parseQueryParams<T>(schema: ZodSchema<T>, searchParams: URLSearchParams) {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of searchParams.entries()) {
    const existing = raw[key];
    if (existing !== undefined) {
      raw[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      raw[key] = value;
    }
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      data: null,
      response: apiError(
        "VALIDATION_ERROR",
        "Invalid query parameters",
        400,
        result.error.issues.map((e) => ({ path: e.path.join("."), message: e.message }))
      ),
    };
  }
  return { data: result.data, response: null };
}

export function parseBody<T>(schema: ZodSchema<T>, body: unknown) {
  try {
    const result = schema.safeParse(body);
    if (!result.success) {
      return {
        data: null,
        response: apiError(
          "VALIDATION_ERROR",
          "Invalid request body",
          400,
          result.error.issues.map((e) => ({ path: e.path.join("."), message: e.message }))
        ),
      };
    }
    return { data: result.data, response: null };
  } catch {
    return { data: null, response: apiError("BAD_REQUEST", "Invalid JSON body", 400) };
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("VALIDATION_ERROR", "Validation failed", 400,
      error.issues.map((e) => ({ path: e.path.join("."), message: e.message }))
    );
  }
  console.error("[API Error]", error);
  return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
}
