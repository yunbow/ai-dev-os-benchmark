export interface ActionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  fieldErrors?: Record<string, string[]>;
}

export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = { success: false; error: ActionError };
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function actionSuccess<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

export function actionFailure(
  code: string,
  message: string,
  options?: { details?: Record<string, unknown>; fieldErrors?: Record<string, string[]> }
): ActionFailure {
  return {
    success: false,
    error: {
      code,
      message,
      ...(options?.details ? { details: options.details } : {}),
      ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
    },
  };
}

export function isActionSuccess<T>(
  result: ActionResult<T>
): result is ActionSuccess<T> {
  return result.success === true;
}

export function isActionFailure<T>(
  result: ActionResult<T>
): result is ActionFailure {
  return result.success === false;
}

// Wrap a server action to catch unexpected errors without leaking stack traces
export async function withAction<T>(
  fn: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    // Log the full error server-side but never return it to the client
    console.error("[Server Action Error]", error);
    return actionFailure(
      "INTERNAL_ERROR",
      "An unexpected error occurred. Please try again."
    );
  }
}
