import { prisma } from "@/lib/prisma/client";
import type { ListTasksInput, CreateTaskInput, UpdateTaskInput } from "@/features/tasks/schema";

const taskInclude = {
  category: { select: { id: true, name: true, color: true } },
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
};

export async function listTasks(userId: string, input: ListTasksInput) {
  const {
    cursor,
    limit,
    status,
    priority,
    categoryId,
    assigneeId,
    teamId,
    search,
    sortBy,
    sortOrder,
  } = input;

  const searchFilter = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const ownershipFilter = teamId
    ? { teamId }
    : { OR: [{ creatorId: userId }, { assigneeId: userId }] };

  const tasks = await prisma.task.findMany({
    where: {
      ...ownershipFilter,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(categoryId && { categoryId }),
      ...(assigneeId && { assigneeId }),
      ...searchFilter,
    },
    include: taskInclude,
    orderBy:
      sortBy === "priority"
        ? { priority: sortOrder }
        : sortBy === "dueDate"
        ? { dueDate: sortOrder }
        : { createdAt: sortOrder },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = tasks.length > limit;
  const items = hasMore ? tasks.slice(0, limit) : tasks;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, nextCursor, hasMore };
}

export async function getTask(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });
}

export async function createTask(creatorId: string, input: CreateTaskInput) {
  return prisma.task.create({
    data: {
      ...input,
      creatorId,
    },
    include: taskInclude,
  });
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
  const { updatedAt: _updatedAt, ...data } = input;
  return prisma.task.update({
    where: { id: taskId },
    data,
    include: taskInclude,
  });
}

export async function deleteTask(taskId: string) {
  return prisma.task.delete({ where: { id: taskId } });
}
