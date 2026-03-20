import { Prisma, TaskPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decodeCursor, encodeCursor } from "@/lib/action-helpers";
import type { TaskFilterInput } from "./schemas";
import type { CursorPaginationResult } from "@/lib/action-helpers";

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

export const taskInclude = {
  category: true,
  user: {
    select: { id: true, name: true, email: true, image: true },
  },
} as const;

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: typeof taskInclude;
}>;

export async function listTasks(
  userId: string,
  filters: TaskFilterInput
): Promise<CursorPaginationResult<TaskWithRelations>> {
  const {
    status,
    priority,
    categoryId,
    assigneeId,
    teamId,
    search,
    sortBy,
    sortOrder,
    cursor,
    limit,
  } = filters;

  // Build base where clause
  const where: Prisma.TaskWhereInput = {
    // Scope: personal tasks or team tasks
    ...(teamId !== undefined
      ? { teamId: teamId ?? null }
      : { userId }),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(assigneeId ? { assigneeId } : {}),
    // Full-text search (parameterized via Prisma - no SQL injection)
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  // Cursor-based pagination
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      // Use composite cursor for stable pagination
      (where as Record<string, unknown>).AND = [
        {
          OR: [
            { createdAt: { lt: decoded.createdAt } },
            {
              createdAt: decoded.createdAt,
              id: { lt: decoded.id },
            },
          ],
        },
      ];
    }
  }

  // Determine orderBy
  let orderBy: Prisma.TaskOrderByWithRelationInput[];
  if (sortBy === "priority") {
    // Sort by priority rank then createdAt
    orderBy = [{ priority: sortOrder }, { createdAt: "desc" }, { id: "desc" }];
  } else if (sortBy === "dueDate") {
    orderBy = [
      { dueDate: { sort: sortOrder, nulls: "last" } },
      { createdAt: "desc" },
      { id: "desc" },
    ];
  } else {
    // createdAt (default)
    orderBy = [{ createdAt: sortOrder }, { id: sortOrder }];
  }

  // Fetch one extra to determine if there are more pages
  const take = limit + 1;

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      take,
      include: taskInclude,
    }),
    prisma.task.count({ where }),
  ]);

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;

  const lastItem = data[data.length - 1];
  const nextCursor =
    hasMore && lastItem
      ? encodeCursor({ id: lastItem.id, createdAt: lastItem.createdAt })
      : null;

  return { data, nextCursor, hasMore };
}

export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: taskInclude,
  });
}
