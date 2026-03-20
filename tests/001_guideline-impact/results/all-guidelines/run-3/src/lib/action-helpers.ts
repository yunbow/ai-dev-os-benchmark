import { ZodError } from "zod";

// ─── ActionResult Types ───────────────────────────────────────────────────────

export interface ActionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  fieldErrors?: Record<string, string[]>;
}

export interface ActionSuccess<T> {
  success: true;
  data: T;
}

export interface ActionFailure {
  success: false;
  error: ActionError;
}

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

// ─── Error Helpers ────────────────────────────────────────────────────────────

export function actionSuccess<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

export function actionError(code: string, message: string, details?: Record<string, unknown>): ActionFailure {
  return { success: false, error: { code, message, details } };
}

export function actionFieldError(fieldErrors: Record<string, string[]>): ActionFailure {
  return {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      fieldErrors,
    },
  };
}

// ─── Standard Error Factories ─────────────────────────────────────────────────

export const ActionErrors = {
  unauthorized: (): ActionFailure =>
    actionError("UNAUTHORIZED", "Authentication required"),

  forbidden: (): ActionFailure =>
    actionError("FORBIDDEN", "You do not have permission to perform this action"),

  notFound: (entity = "Resource"): ActionFailure =>
    actionError("NOT_FOUND", `${entity} not found`),

  internal: (details?: string): ActionFailure =>
    actionError("INTERNAL_ERROR", "An unexpected error occurred", details ? { details } : undefined),

  rateLimited: (retryAfter?: number): ActionFailure =>
    actionError("RATE_LIMITED", "Too many requests. Please try again later.", retryAfter ? { retryAfter } : undefined),
};

// ─── withAction Wrapper ───────────────────────────────────────────────────────

export async function withAction<T>(
  fn: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return actionFieldError(fieldErrors);
    }

    if (error instanceof AppError) {
      return actionError(error.code, error.message);
    }

    console.error("[withAction] Unexpected error:", error);
    return ActionErrors.internal();
  }
}

// ─── Domain Error Class ───────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function encodeCursor(payload: { id: string; createdAt: Date }): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decodeCursor(cursor: string): { id: string; createdAt: Date } | null {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
    return { id: decoded.id, createdAt: new Date(decoded.createdAt) };
  } catch {
    return null;
  }
}
