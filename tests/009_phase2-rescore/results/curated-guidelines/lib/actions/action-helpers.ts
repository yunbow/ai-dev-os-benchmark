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

export function createSuccess<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

export function createFailure(error: ActionError): ActionFailure {
  return { success: false, error };
}

export const ActionErrors = {
  unauthorized: (): ActionFailure => ({
    success: false,
    error: { code: "UNAUTHORIZED", message: "Authentication required" },
  }),
  forbidden: (): ActionFailure => ({
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission" },
  }),
  notFound: (entity = "Resource"): ActionFailure => ({
    success: false,
    error: { code: "NOT_FOUND", message: `${entity} not found` },
  }),
  validation: (fieldErrors: Record<string, string[]>): ActionFailure => ({
    success: false,
    error: { code: "VALIDATION_ERROR", message: "Validation failed", fieldErrors },
  }),
  internal: (): ActionFailure => ({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  }),
  conflict: (message: string): ActionFailure => ({
    success: false,
    error: { code: "CONFLICT", message },
  }),
};

export async function requireAuth(): Promise<
  { success: true; userId: string } | ActionFailure
> {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user?.id) {
    return ActionErrors.unauthorized();
  }
  return { success: true, userId: session.user.id };
}

export async function withAction<T>(
  fn: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    console.error("Action error:", error);
    return ActionErrors.internal();
  }
}
