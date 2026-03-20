"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  taskFilterSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskFilterInput,
} from "@/lib/validations";
import type { ActionResult } from "@/lib/utils";
import { Task, TaskStatus, TaskPriority, Prisma } from "@prisma/client";

type TaskWithRelations = Task & {
  creator: { id: string; name: string | null; email: string };
  assignee: { id: string; name: string | null; email: string } | null;
  category: { id: string; name: string; color: string } | null;
  team: { id: string; name: string } | null;
};

type PaginatedTasks = {
  tasks: TaskWithRelations[];
  nextCursor: string | null;
  hasMore: boolean;
};

async function verifyTaskAccess(
  taskId: string,
  userId: string,
  requireOwnerOrAdmin = false
): Promise<{ task: Task; hasAccess: boolean; canModify: boolean }> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      team: {
        include: {
          members: {
            where: { userId },
            select: { role: true },
          },
        },
      },
    },
  });

  if (!task) {
    return { task: task as unknown as Task, hasAccess: false, canModify: false };
  }

  const isCreator = task.creatorId === userId;
  let teamRole: string | null = null;

  if (task.teamId && task.team) {
    const membership = (task.team as { members: { role: string }[] }).members[0];
    if (!membership) {
      return { task, hasAccess: false, canModify: false };
    }
    teamRole = membership.role;
  }

  const hasAccess = isCreator || teamRole !== null || !task.teamId;
  const canModify =
    isCreator ||
    teamRole === "OWNER" ||
    (!requireOwnerOrAdmin && teamRole === "MEMBER");

  return { task, hasAccess, canModify };
}

export async function createTask(
  input: CreateTaskInput
): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { title, description, status, priority, dueDate, categoryId, assigneeId, teamId } = parsed.data;

  // Verify team membership if teamId provided
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!membership || membership.role === "VIEWER") {
      return { success: false, error: "Insufficient permissions" };
    }
  }

  // Verify assignee is a team member if both provided
  if (assigneeId && teamId) {
    const assigneeMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: assigneeId } },
    });
    if (!assigneeMembership) {
      return { success: false, error: "Assignee must be a team member" };
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status: status as TaskStatus,
      priority: priority as TaskPriority,
      dueDate: dueDate ? new Date(dueDate) : null,
      categoryId: categoryId || null,
      assigneeId: assigneeId || null,
      teamId: teamId || null,
      creatorId: session.user.id,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, color: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return { success: true, data: task as TaskWithRelations };
}

export async function updateTask(
  input: UpdateTaskInput
): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { id, updatedAt, ...data } = parsed.data;

  const { task, hasAccess, canModify } = await verifyTaskAccess(
    id,
    session.user.id
  );

  if (!hasAccess) {
    return { success: false, error: "Task not found" };
  }

  if (!canModify) {
    return { success: false, error: "Insufficient permissions" };
  }

  // Optimistic concurrency check
  if (updatedAt && task.updatedAt.toISOString() !== updatedAt) {
    return {
      success: false,
      error: "Task was modified by another user. Please refresh and try again.",
    };
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      status: data.status as TaskStatus | undefined,
      priority: data.priority as TaskPriority | undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
      categoryId: data.categoryId || null,
      assigneeId: data.assigneeId || null,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, color: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return { success: true, data: updated as TaskWithRelations };
}

export async function updateTaskStatus(
  input: { id: string; status: string; updatedAt?: string }
): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateTaskStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { id, status, updatedAt } = parsed.data;

  const { task, hasAccess, canModify } = await verifyTaskAccess(
    id,
    session.user.id
  );

  if (!hasAccess) {
    return { success: false, error: "Task not found" };
  }

  if (!canModify) {
    return { success: false, error: "Insufficient permissions" };
  }

  if (updatedAt && task.updatedAt.toISOString() !== updatedAt) {
    return {
      success: false,
      error: "Task was modified by another user. Please refresh and try again.",
    };
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { status: status as TaskStatus },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, color: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return { success: true, data: updated as TaskWithRelations };
}

export async function deleteTask(taskId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const { hasAccess, canModify } = await verifyTaskAccess(
    taskId,
    session.user.id
  );

  if (!hasAccess) {
    return { success: false, error: "Task not found" };
  }

  if (!canModify) {
    return { success: false, error: "Insufficient permissions" };
  }

  await prisma.task.delete({ where: { id: taskId } });

  return { success: true, data: undefined };
}

export async function getTasks(
  filter: Partial<TaskFilterInput>
): Promise<ActionResult<PaginatedTasks>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = taskFilterSchema.safeParse(filter);
  if (!parsed.success) {
    return { success: false, error: "Invalid filter parameters" };
  }

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
  } = parsed.data;

  const where: Prisma.TaskWhereInput = {
    OR: [
      { creatorId: session.user.id },
      { assigneeId: session.user.id },
      {
        team: {
          members: {
            some: { userId: session.user.id },
          },
        },
      },
    ],
    ...(status && { status: status as TaskStatus }),
    ...(priority && { priority: priority as TaskPriority }),
    ...(categoryId && { categoryId }),
    ...(assigneeId && { assigneeId }),
    ...(teamId && { teamId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy: Prisma.TaskOrderByWithRelationInput =
    sortBy === "priority"
      ? { priority: sortOrder }
      : { [sortBy]: sortOrder };

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, color: true } },
      team: { select: { id: true, name: true } },
    },
  });

  const hasMore = tasks.length > limit;
  const items = hasMore ? tasks.slice(0, -1) : tasks;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    success: true,
    data: {
      tasks: items as TaskWithRelations[],
      nextCursor,
      hasMore,
    },
  };
}

export async function getTask(
  taskId: string
): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { creatorId: session.user.id },
        { assigneeId: session.user.id },
        {
          team: {
            members: {
              some: { userId: session.user.id },
            },
          },
        },
      ],
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, color: true } },
      team: { select: { id: true, name: true } },
    },
  });

  if (!task) {
    return { success: false, error: "Task not found" };
  }

  return { success: true, data: task as TaskWithRelations };
}
