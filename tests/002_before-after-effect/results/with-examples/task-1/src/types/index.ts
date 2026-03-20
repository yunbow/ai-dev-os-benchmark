export type ActionSuccess<T = void> = T extends void
  ? { success: true }
  : { success: true; data: T };

export type ActionError = { success: false; error: string };

export type ActionResult<T = void> = ActionSuccess<T> | ActionError;

export function createActionSuccess(): ActionSuccess<void>;
export function createActionSuccess<T>(data: T): ActionSuccess<T>;
export function createActionSuccess<T>(data?: T): ActionSuccess<T> | ActionSuccess<void> {
  if (data === undefined) return { success: true };
  return { success: true, data };
}

export function createActionError(error: string): ActionError {
  return { success: false, error };
}

export const ActionErrors = {
  unauthorized: () => "Unauthorized",
  forbidden: () => "Access denied",
  notFound: (resource: string) => `${resource} not found`,
  internal: () => "Internal server error",
  validation: (msg: string) => msg,
  tooManyRequests: () => "Too many attempts. Please try again later.",
};
