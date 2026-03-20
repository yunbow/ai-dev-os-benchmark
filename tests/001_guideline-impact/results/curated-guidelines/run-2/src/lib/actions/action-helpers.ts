import { auth } from "@/lib/auth";
import { ActionError, ActionErrors, PRISMA_ERROR_MAP } from "./errors";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

export type PaginatedResult<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export interface AuthenticatedSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
  };
}

export async function requireAuth(): Promise<
  ActionResult<AuthenticatedSession>
> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: ActionErrors.unauthorized() };
  }

  return {
    success: true,
    data: session as AuthenticatedSession,
  };
}

export async function requireOwnership(
  resourceUserId: string,
  currentUserId: string
): Promise<ActionResult<true>> {
  if (resourceUserId !== currentUserId) {
    return { success: false, error: ActionErrors.forbidden() };
  }
  return { success: true, data: true };
}

export async function withAction<T>(
  fn: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      const mapped = PRISMA_ERROR_MAP[prismaError.code];
      if (mapped) {
        return { success: false, error: mapped };
      }
    }

    console.error("Action error:", error);
    return { success: false, error: ActionErrors.internal() };
  }
}

export async function executePaginatedQuery<T extends { id: string }>(
  queryFn: (params: { take: number; cursor?: { id: string } }) => Promise<T[]>,
  cursor?: string,
  pageSize = 20
): Promise<PaginatedResult<T>> {
  const take = pageSize + 1;

  const results = await queryFn({
    take,
    ...(cursor ? { cursor: { id: cursor } } : {}),
  });

  const hasMore = results.length > pageSize;
  const data = hasMore ? results.slice(0, pageSize) : results;
  const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

  return {
    data,
    nextCursor,
    hasMore,
  };
}
