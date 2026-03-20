// ActionResult pattern types

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

export const ActionErrors = {
  unauthorized: () => ({
    code: "UNAUTHORIZED",
    message: "Authentication required",
  }),
  forbidden: () => ({
    code: "FORBIDDEN",
    message: "Access denied",
  }),
  notFound: (resource: string) => ({
    code: "NOT_FOUND",
    message: `${resource} not found`,
  }),
  validation: (message: string) => ({
    code: "VALIDATION_ERROR",
    message,
  }),
  internal: () => ({
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  }),
};

export function createActionSuccess<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}
