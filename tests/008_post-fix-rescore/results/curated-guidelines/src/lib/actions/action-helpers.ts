export interface ActionSuccess<T> {
  success: true;
  data: T;
}

export interface ActionFailure {
  success: false;
  error: ActionError;
}

export interface ActionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  fieldErrors?: Record<string, string[]>;
}

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function actionSuccess<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

export function actionFailure(error: ActionError): ActionFailure {
  return { success: false, error };
}

export function actionUnauthorized(): ActionFailure {
  return actionFailure({
    code: "UNAUTHORIZED",
    message: "Authentication required",
  });
}

export function actionForbidden(): ActionFailure {
  return actionFailure({
    code: "FORBIDDEN",
    message: "You do not have permission to perform this action",
  });
}

export function actionNotFound(resource = "Resource"): ActionFailure {
  return actionFailure({
    code: "NOT_FOUND",
    message: `${resource} not found`,
  });
}

export function actionValidationError(
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionFailure {
  return actionFailure({
    code: "VALIDATION_ERROR",
    message,
    fieldErrors,
  });
}

export function actionInternalError(): ActionFailure {
  return actionFailure({
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred. Please try again.",
  });
}
