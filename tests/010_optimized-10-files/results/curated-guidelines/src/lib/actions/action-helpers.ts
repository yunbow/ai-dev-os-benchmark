import { ZodError, type ZodSchema } from "zod";
import { Prisma } from "@prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import { auth } from "@/lib/auth/config";

// ─── ActionResult Types ───────────────────────────────────────────────────────

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

// ─── Error Factories ──────────────────────────────────────────────────────────

export const ActionErrors = {
  unauthorized: (message = "Authentication required"): ActionFailure => ({
    success: false,
    error: { code: "UNAUTHORIZED", message },
  }),
  forbidden: (message = "You do not have permission to perform this action"): ActionFailure => ({
    success: false,
    error: { code: "FORBIDDEN", message },
  }),
  notFound: (entity = "Resource"): ActionFailure => ({
    success: false,
    error: { code: "NOT_FOUND", message: `${entity} not found` },
  }),
  validation: (fieldErrors: Record<string, string[]>): ActionFailure => ({
    success: false,
    error: { code: "VALIDATION_ERROR", message: "Validation failed", fieldErrors },
  }),
  conflict: (message: string): ActionFailure => ({
    success: false,
    error: { code: "CONFLICT", message },
  }),
  rateLimit: (message = "Too many requests. Please try again later."): ActionFailure => ({
    success: false,
    error: { code: "RATE_LIMIT_EXCEEDED", message },
  }),
  internal: (message = "An unexpected error occurred"): ActionFailure => ({
    success: false,
    error: { code: "INTERNAL_ERROR", message },
  }),
};

export function createActionSuccess<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

// ─── Error Handler ────────────────────────────────────────────────────────────

export function handleActionError(error: unknown): ActionFailure {
  if (error instanceof ZodError) {
    return ActionErrors.validation(error.flatten().fieldErrors as Record<string, string[]>);
  }

  if (error instanceof DomainError) {
    return {
      success: false,
      error: { code: error.code, message: error.message },
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return ActionErrors.conflict("A record with this value already exists");
    }
    if (error.code === "P2025") {
      return ActionErrors.notFound();
    }
  }

  console.error("Unhandled action error:", error);
  return ActionErrors.internal();
}

// ─── withAction Wrapper ───────────────────────────────────────────────────────

interface WithActionOptions<D = unknown> {
  data?: D;
  schema?: ZodSchema<D>;
}

interface ActionContext<D> {
  validData: D;
}

export async function withAction<T, D = unknown>(
  fn: (ctx: ActionContext<D>) => Promise<ActionResult<T>>,
  options: WithActionOptions<D>
): Promise<ActionResult<T>> {
  try {
    let validData = options.data as D;

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

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

export async function requireAuth(): Promise<
  { success: true; userId: string } | ActionFailure
> {
  const session = await auth();
  if (!session?.user?.id) {
    return ActionErrors.unauthorized();
  }
  return { success: true, userId: session.user.id };
}

export async function requireOwnership<T extends { userId: string }>(
  resource: T | null,
  userId: string
): Promise<{ success: true; resource: T } | ActionFailure> {
  if (!resource) {
    return ActionErrors.notFound();
  }
  if (resource.userId !== userId) {
    return ActionErrors.forbidden();
  }
  return { success: true, resource };
}

// ─── Cursor-based Pagination ──────────────────────────────────────────────────

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function executeCursorPaginatedQuery<T extends { id: string }>(
  findMany: (args: {
    where?: unknown;
    orderBy?: unknown;
    take?: number;
    cursor?: { id: string };
    skip?: number;
    include?: unknown;
  }) => Promise<T[]>,
  options: {
    where?: unknown;
    orderBy?: unknown;
    take?: number;
    cursor?: string;
    include?: unknown;
  }
): Promise<CursorPaginatedResult<T>> {
  const take = options.take ?? 20;

  const items = await findMany({
    where: options.where,
    orderBy: options.orderBy ?? { createdAt: "desc" },
    take: take + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    include: options.include,
  });

  const hasMore = items.length > take;
  const data = hasMore ? items.slice(0, take) : items;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor, hasMore };
}
