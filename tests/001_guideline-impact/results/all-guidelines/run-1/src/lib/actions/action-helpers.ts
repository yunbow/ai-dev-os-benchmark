import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ZodError, type ZodSchema } from "zod";
import { Prisma } from "@prisma/client";

// ============================================
// ActionResult Types
// ============================================

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

// ============================================
// Helper Functions
// ============================================

export function createActionSuccess<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

export function createActionFailure(error: ActionError): ActionFailure {
  return { success: false, error };
}

// ============================================
// Authentication Helpers
// ============================================

export async function requireAuth(): Promise<
  | { success: true; userId: string }
  | ActionFailure
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    };
  }
  return { success: true, userId: session.user.id };
}

export async function requireOwnership<T extends { creatorId?: string; userId?: string }>(
  resource: T | null,
  userId: string
): Promise<{ success: true; resource: T } | ActionFailure> {
  if (!resource) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Resource not found" },
    };
  }

  const ownerId = resource.creatorId ?? resource.userId;
  if (ownerId !== userId) {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to access this resource",
      },
    };
  }

  return { success: true, resource };
}

// ============================================
// Error Handling
// ============================================

export function handleActionError(error: unknown): ActionError {
  if (error instanceof ZodError) {
    return {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return { code: "UNIQUE_CONSTRAINT", message: "This value already exists" };
    }
    if (error.code === "P2025") {
      return { code: "NOT_FOUND", message: "Record not found" };
    }
  }

  if (error instanceof Error) {
    return {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  };
}

// ============================================
// withAction Wrapper
// ============================================

export async function withAction<T, D = unknown>(
  fn: (params: { validData?: D }) => Promise<ActionResult<T>>,
  options: {
    data?: D;
    schema?: ZodSchema<D>;
  } = {}
): Promise<ActionResult<T>> {
  try {
    let validData: D | undefined = options.data;

    if (options.schema && options.data !== undefined) {
      const parsed = options.schema.safeParse(options.data);
      if (!parsed.success) {
        return {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            fieldErrors: parsed.error.flatten().fieldErrors as Record<
              string,
              string[]
            >,
          },
        };
      }
      validData = parsed.data;
    }

    return await fn({ validData });
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}

// ============================================
// Pagination
// ============================================

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
}

export async function executeCursorPaginatedQuery<T extends { id: string }>(
  findMany: (args: {
    cursor?: { id: string };
    take: number;
    skip?: number;
    where?: unknown;
    orderBy?: unknown;
    include?: unknown;
    select?: unknown;
  }) => Promise<T[]>,
  options: {
    cursor?: string;
    limit?: number;
    where?: unknown;
    orderBy?: unknown;
    include?: unknown;
    select?: unknown;
  }
): Promise<PaginatedResult<T>> {
  const limit = options.limit ?? 20;

  const items = await findMany({
    cursor: options.cursor ? { id: options.cursor } : undefined,
    skip: options.cursor ? 1 : 0,
    take: limit + 1,
    where: options.where,
    orderBy: options.orderBy,
    include: options.include,
    select: options.select,
  });

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor, hasMore };
}

// ============================================
// Team Authorization
// ============================================

export async function requireTeamMember(
  teamId: string,
  userId: string,
  requiredRoles?: ("OWNER" | "MEMBER" | "VIEWER")[]
): Promise<
  | { success: true; role: "OWNER" | "MEMBER" | "VIEWER" }
  | ActionFailure
> {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!member) {
    return {
      success: false,
      error: { code: "FORBIDDEN", message: "You are not a member of this team" },
    };
  }

  if (requiredRoles && !requiredRoles.includes(member.role)) {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You do not have sufficient permissions",
      },
    };
  }

  return { success: true, role: member.role };
}
