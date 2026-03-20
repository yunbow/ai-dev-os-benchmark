import { db } from "@/lib/db";
import { canEditTask, canDeleteTask } from "@/lib/rbac";
import type { CreateTaskInput, UpdateTaskInput, TaskFilterInput } from "@/lib/validations/task";
import type { TaskWithRelations } from "@/types";

const TASK_INCLUDE = {
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  category: { select: { id: true, name: true, color: true } },
} as const;

const PAGE_SIZE = 20;

async function getMemberRole(userId: string, teamId: string) {
  const member = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });
  return member?.role ?? null;
}

export async function getTasks(userId: string, filters: TaskFilterInput) {
  const where: Record<string, unknown> = {};

  if (filters.teamId) {
    // Verify membership
    const role = await getMemberRole(userId, filters.teamId);
    if (!role) throw new Error("FORBIDDEN");
    where.teamId = filters.teamId;
  } else {
    where.creatorId = userId;
    where.teamId = null;
  }

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const orderBy =
    filters.sortBy === "priority"
      ? [{ priority: filters.sortOrder as "asc" | "desc" }]
      : [{ [filters.sortBy ?? "createdAt"]: filters.sortOrder ?? "desc" }];

  const tasks = await db.task.findMany({
    where,
    include: TASK_INCLUDE,
    orderBy,
    take: PAGE_SIZE + 1,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });

  const hasMore = tasks.length > PAGE_SIZE;
  const data = hasMore ? tasks.slice(0, PAGE_SIZE) : tasks;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data: data as TaskWithRelations[], nextCursor, hasMore };
}

export async function getTaskById(id: string, userId: string): Promise<TaskWithRelations> {
  const task = await db.task.findUnique({
    where: { id },
    include: TASK_INCLUDE,
  });

  if (!task) throw new Error("NOT_FOUND");

  if (task.teamId) {
    const role = await getMemberRole(userId, task.teamId);
    if (!role) throw new Error("FORBIDDEN");
  } else if (task.creatorId !== userId) {
    throw new Error("FORBIDDEN");
  }

  return task as TaskWithRelations;
}

export async function createTask(data: CreateTaskInput, userId: string): Promise<TaskWithRelations> {
  if (data.teamId) {
    const role = await getMemberRole(userId, data.teamId);
    if (!role || role === "VIEWER") throw new Error("FORBIDDEN");
  }

  const task = await db.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status ?? "TODO",
      priority: data.priority ?? "MEDIUM",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      categoryId: data.categoryId ?? null,
      assigneeId: data.assigneeId ?? null,
      teamId: data.teamId ?? null,
      creatorId: userId,
    },
    include: TASK_INCLUDE,
  });

  return task as TaskWithRelations;
}

export async function updateTask(
  id: string,
  data: UpdateTaskInput,
  userId: string
): Promise<TaskWithRelations> {
  const task = await db.task.findUnique({ where: { id } });
  if (!task) throw new Error("NOT_FOUND");

  let role = null;
  if (task.teamId) {
    role = await getMemberRole(userId, task.teamId);
    if (!role) throw new Error("FORBIDDEN");
  }

  const isCreator = task.creatorId === userId;
  if (!canEditTask(role, isCreator)) throw new Error("FORBIDDEN");

  // Optimistic update: check updatedAt for concurrent edit detection
  const updated = await db.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
    },
    include: TASK_INCLUDE,
  });

  return updated as TaskWithRelations;
}

export async function deleteTask(id: string, userId: string): Promise<void> {
  const task = await db.task.findUnique({ where: { id } });
  if (!task) throw new Error("NOT_FOUND");

  let role = null;
  if (task.teamId) {
    role = await getMemberRole(userId, task.teamId);
    if (!role) throw new Error("FORBIDDEN");
  }

  const isCreator = task.creatorId === userId;
  if (!canDeleteTask(role, isCreator)) throw new Error("FORBIDDEN");

  await db.task.delete({ where: { id } });
}
