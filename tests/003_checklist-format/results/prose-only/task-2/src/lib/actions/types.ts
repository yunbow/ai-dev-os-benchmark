"use server";

// ActionResult pattern — all server actions return this shape
export type ActionSuccess<T> = {
  success: true;
  data: T;
};

export type ActionError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ActionResult<T> = ActionSuccess<T> | ActionError;

// Centralised error constructors
export const ActionErrors = {
  unauthorized: (): ActionError => ({
    success: false,
    error: { code: "UNAUTHORIZED", message: "Authentication required" },
  }),
  forbidden: (): ActionError => ({
    success: false,
    error: { code: "FORBIDDEN", message: "Access denied" },
  }),
  notFound: (resource: string): ActionError => ({
    success: false,
    error: { code: "NOT_FOUND", message: `${resource} not found` },
  }),
  validationError: (message: string): ActionError => ({
    success: false,
    error: { code: "VALIDATION_ERROR", message },
  }),
  internalError: (): ActionError => ({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  }),
};

export function createActionSuccess<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}
