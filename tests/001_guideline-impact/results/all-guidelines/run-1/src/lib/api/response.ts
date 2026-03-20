export interface ApiError {
  code: string;
  message: string;
  details?: unknown[];
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown[]
): Response {
  return Response.json(
    { error: { code, message, details: details ?? [] } },
    { status }
  );
}

export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function apiUnauthorized(): Response {
  return apiError("UNAUTHORIZED", "Authentication required", 401);
}

export function apiForbidden(): Response {
  return apiError("FORBIDDEN", "Insufficient permissions", 403);
}

export function apiNotFound(resource = "Resource"): Response {
  return apiError("NOT_FOUND", `${resource} not found`, 404);
}

export function apiValidationError(
  message: string,
  details?: unknown[]
): Response {
  return apiError("VALIDATION_ERROR", message, 400, details);
}

export function apiRateLimited(retryAfter: number): Response {
  const response = apiError(
    "RATE_LIMIT_EXCEEDED",
    "Too many requests. Please try again later.",
    429
  );
  return response;
}

// Map ActionResult errors to HTTP responses
export function actionResultToResponse<T>(
  result: { success: true; data: T } | { success: false; error: { code: string; message: string } },
  successStatus = 200
): Response {
  if (!result.success) {
    const { code, message } = result.error;
    switch (code) {
      case "UNAUTHORIZED":
        return apiUnauthorized();
      case "FORBIDDEN":
        return apiForbidden();
      case "NOT_FOUND":
        return apiNotFound();
      case "VALIDATION_ERROR":
        return apiValidationError(message);
      default:
        return apiError(code, message, 500);
    }
  }
  return apiSuccess(result.data, successStatus);
}
