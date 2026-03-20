import { prisma } from "@/lib/prisma";
import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import type { TaskFiltersInput } from "@/features/task/schema/task-schema";

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const taskInclude = {
  creator: { select: { id: true, email: true, name: true } },
  assignee: { select: { id: true, email: true, name: true } },
  category: { select: { id: true, name: true, color: true } },
  team: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: typeof taskInclude;
}>;

export async function fetchTasks(
  userId: string,
  filters: TaskFiltersInput
): Promise<{ tasks: TaskWithRelations[]; nextCursor: string | null; hasMore: boolean }> {
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

  const where: Prisma.TaskWhereInput = {
    AND: [
      // Access control: user owns or is assigned or is a team member
      {
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
          teamId
            ? {
                team: {
                  members: { some: { userId } },
                },
              }
            : {
                team: {
                  members: { some: { userId } },
                },
              },
        ],
      },
      status ? { status } : {},
      priority ? { priority } : {},
      categoryId ? { categoryId } : {},
      assigneeId ? { assigneeId } : {},
      teamId ? { teamId } : {},
      search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                description: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : {},
    ],
  };

  let orderBy: Prisma.TaskOrderByWithRelationInput[];

  if (sortBy === "priority") {
    // Sort by priority enum order
    orderBy = [{ priority: sortOrder }, { createdAt: "desc" }];
  } else {
    orderBy = [{ [sortBy]: sortOrder }, { id: "asc" }];
  }

  const take = limit + 1;

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy,
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = tasks.length > limit;
  const result = hasMore ? tasks.slice(0, limit) : tasks;
  const nextCursor = hasMore ? result[result.length - 1].id : null;

  return { tasks: result, nextCursor, hasMore };
}

export async function fetchTaskById(
  taskId: string,
  userId: string
): Promise<TaskWithRelations | null> {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { creatorId: userId },
        { assigneeId: userId },
        {
          team: {
            members: { some: { userId } },
          },
        },
      ],
    },
    include: taskInclude,
  });

  return task;
}

export async function canMutateTask(
  taskId: string,
  userId: string
): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      creatorId: true,
      teamId: true,
      team: {
        select: {
          members: {
            where: { userId },
            select: { role: true },
          },
        },
      },
    },
  });

  if (!task) return false;
  if (task.creatorId === userId) return true;

  if (task.team?.members?.[0]) {
    const role = task.team.members[0].role;
    return role === "OWNER";
  }

  return false;
}

export async function getUserTaskStats(userId: string) {
  const [total, byStatus, overdue] = await Promise.all([
    prisma.task.count({
      where: {
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
          { team: { members: { some: { userId } } } },
        ],
      },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: {
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
          { team: { members: { some: { userId } } } },
        ],
      },
      _count: { status: true },
    }),
    prisma.task.count({
      where: {
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.DONE },
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
          { team: { members: { some: { userId } } } },
        ],
      },
    }),
  ]);

  const statusCounts = byStatus.reduce(
    (acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    },
    {} as Record<TaskStatus, number>
  );

  return {
    total,
    todo: statusCounts[TaskStatus.TODO] ?? 0,
    inProgress: statusCounts[TaskStatus.IN_PROGRESS] ?? 0,
    done: statusCounts[TaskStatus.DONE] ?? 0,
    overdue,
  };
}
