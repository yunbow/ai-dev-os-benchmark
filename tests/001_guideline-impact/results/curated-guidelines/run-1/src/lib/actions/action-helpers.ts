import { ZodSchema, ZodError } from "zod";
import { Prisma } from "@prisma/client";

// ---- Types ----

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

// ---- Helpers ----

export const ActionErrors = {
  unauthorized: (): ActionFailure => ({
    success: false,
    error: { code: "UNAUTHORIZED", message: "Authentication required" },
  }),
  forbidden: (): ActionFailure => ({
    success: false,
    error: { code: "FORBIDDEN", message: "You do not have permission to perform this action" },
  }),
  notFound: (entity = "Resource"): ActionFailure => ({
    success: false,
    error: { code: "NOT_FOUND", message: `${entity} not found` },
  }),
  validation: (fieldErrors: Record<string, string[]>): ActionFailure => ({
    success: false,
    error: { code: "VALIDATION_ERROR", message: "Validation failed", fieldErrors },
  }),
  internal: (details?: string): ActionFailure => ({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      ...(details ? { details: { message: details } } : {}),
    },
  }),
  conflict: (message: string): ActionFailure => ({
    success: false,
    error: { code: "CONFLICT", message },
  }),
};

// ---- Error Conversion ----

const PRISMA_ERROR_MAP: Record<string, { code: string; message: string }> = {
  P2002: { code: "UNIQUE_CONSTRAINT", message: "This record already exists" },
  P2025: { code: "NOT_FOUND", message: "Record not found" },
  P2003: { code: "FOREIGN_KEY_CONSTRAINT", message: "Related record not found" },
};

export function handleActionError(error: unknown): ActionFailure {
  if (error instanceof ZodError) {
    return ActionErrors.validation(error.flatten().fieldErrors as Record<string, string[]>);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_ERROR_MAP[error.code];
    if (mapped) {
      return { success: false, error: { code: mapped.code, message: mapped.message } };
    }
  }

  console.error("[ActionError]", error);
  return ActionErrors.internal();
}

// ---- withAction wrapper ----

interface WithActionOptions<D> {
  data?: D;
  schema?: ZodSchema<D>;
}

interface ActionContext<D> {
  validData?: D;
}

export async function withAction<T, D = unknown>(
  fn: (ctx: ActionContext<D>) => Promise<ActionResult<T>>,
  options: WithActionOptions<D> = {}
): Promise<ActionResult<T>> {
  try {
    let validData: D | undefined;

    if (options.schema && options.data !== undefined) {
      const result = options.schema.safeParse(options.data);
      if (!result.success) {
        return ActionErrors.validation(
          result.error.flatten().fieldErrors as Record<string, string[]>
        );
      }
      validData = result.data;
    }

    return await fn({ validData });
  } catch (error) {
    return handleActionError(error);
  }
}

// ---- Pagination ----

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
}
