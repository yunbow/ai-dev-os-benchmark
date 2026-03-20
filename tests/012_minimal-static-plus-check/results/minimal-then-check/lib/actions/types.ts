export type ActionSuccess<T = void> = {
  success: true;
  data: T;
};

export type ActionFailure = {
  success: false;
  error: string;
  code?: string;
};

export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure;

export function createSuccess<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

export function createFailure(error: string, code?: string): ActionFailure {
  return { success: false, error, code };
}

export const ActionErrors = {
  unauthorized: () => createFailure("Unauthorized", "UNAUTHORIZED"),
  forbidden: () => createFailure("Forbidden", "FORBIDDEN"),
  notFound: (resource: string) =>
    createFailure(`${resource} not found`, "NOT_FOUND"),
  validation: (msg: string) => createFailure(msg, "VALIDATION_ERROR"),
  internal: () => createFailure("Internal server error", "INTERNAL_ERROR"),
  rateLimited: () =>
    createFailure("Too many requests. Try again later.", "RATE_LIMITED"),
};
