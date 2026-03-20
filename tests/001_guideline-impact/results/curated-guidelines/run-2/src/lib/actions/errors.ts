export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "RATE_LIMITED"
  | "BAD_REQUEST";

export interface ActionError {
  code: ActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export const ActionErrors = {
  unauthorized(): ActionError {
    return { code: "UNAUTHORIZED", message: "You must be logged in to perform this action." };
  },
  forbidden(): ActionError {
    return { code: "FORBIDDEN", message: "You do not have permission to perform this action." };
  },
  notFound(resource = "Resource"): ActionError {
    return { code: "NOT_FOUND", message: `${resource} not found.` };
  },
  conflict(message = "A conflict occurred."): ActionError {
    return { code: "CONFLICT", message };
  },
  validationError(fieldErrors?: Record<string, string[]>): ActionError {
    return { code: "VALIDATION_ERROR", message: "Validation failed.", fieldErrors };
  },
  internal(message = "An unexpected error occurred."): ActionError {
    return { code: "INTERNAL_ERROR", message };
  },
  rateLimited(): ActionError {
    return { code: "RATE_LIMITED", message: "Too many requests. Please try again later." };
  },
  badRequest(message = "Bad request."): ActionError {
    return { code: "BAD_REQUEST", message };
  },
};

export const PRISMA_ERROR_MAP: Record<string, ActionError> = {
  P2002: { code: "CONFLICT", message: "A record with this data already exists." },
  P2025: { code: "NOT_FOUND", message: "Record not found." },
  P2003: { code: "BAD_REQUEST", message: "Foreign key constraint failed." },
  P2014: { code: "BAD_REQUEST", message: "Relation violation." },
};
