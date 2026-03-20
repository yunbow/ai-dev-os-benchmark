import { z, ZodError, type ZodSchema } from "zod";
import { auth } from "@/lib/auth/auth";
import { Prisma } from "@prisma/client";

export interface ActionSuccess<T> {
  success: true;
  data: T;
}

export interface ActionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  fieldErrors?: Record<string, string[]>;
}

export interface ActionFailure {
  success: false;
  error: ActionError;
}

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function createActionSuccess<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

export function createActionFailure(error: ActionError): ActionFailure {
  return { success: false, error };
}

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
  internal: (message = "An unexpected error occurred"): ActionFailure => ({
    success: false,
    error: { code: "INTERNAL_ERROR", message },
  }),
  conflict: (message: string): ActionFailure => ({
    success: false,
    error: { code: "CONFLICT", message },
  }),
};

export function handleActionError(error: unknown): ActionFailure {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return ActionErrors.validation(fieldErrors);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return ActionErrors.conflict("This record already exists");
    }
    if (error.code === "P2025") {
      return ActionErrors.notFound();
    }
  }

  console.error("Unhandled action error:", error);
  return ActionErrors.internal();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, ...ActionErrors.unauthorized() };
  }
  return { success: true as const, userId: session.user.id, session };
}

export async function executePaginatedQuery<T>(
  model: {
    findMany: (args: Record<string, unknown>) => Promise<T[]>;
    count: (args: Record<string, unknown>) => Promise<number>;
  },
  options: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown> | Record<string, unknown>[];
    page: number;
    limit: number;
    include?: Record<string, unknown>;
    select?: Record<string, unknown>;
  }
): Promise<{ items: T[]; total: number; page: number; limit: number; totalPages: number }> {
  const { page, limit, where, orderBy, include, select } = options;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    model.findMany({ where, orderBy, skip, take: limit, include, select }),
    model.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
