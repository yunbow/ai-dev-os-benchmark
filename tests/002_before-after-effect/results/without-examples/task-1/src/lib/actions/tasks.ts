"use server";

import { prisma } from "@/lib/prisma";
import { ActionErrors } from "@/lib/errors";
import { requireAuth, requireTaskOwnership } from "./auth-helpers";
import {
  createTaskSchema,
  updateTaskSchema,
  toggleTaskStatusSchema,
  taskFiltersSchema,
} from "@/lib/validations/task";
import type { ActionResult, TaskWithRelations, PaginationResult } from "@/lib/types";

const TASK_INCLUDE = {
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  category: { select: { id: true, name: true, color: true } },
} as const;

export async function createTask(
  formData: FormData,
): Promise<ActionResult<TaskWithRelations>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId } = authResult.data;

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || null,
    status: formData.get("status") || "TODO",
    priority: formData.get("priority") || "MEDIUM",
    dueDate: formData.get("dueDate") || null,
    categoryId: formData.get("categoryId") || null,
    assigneeId: formData.get("assigneeId") || null,
    teamId: formData.get("teamId") || null,
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  const data = parsed.data;

  // If teamId provided, verify user is a member
  if (data.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: data.teamId } },
    });
    if (!membership) {
      return { success: false, error: ActionErrors.TEAM_ACCESS_DENIED };
    }
  }

  // If categoryId provided, verify user has access
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { userId: true, teamId: true },
    });
    if (!category) {
      return { success: false, error: ActionErrors.CATEGORY_NOT_FOUND };
    }
    const hasAccess =
      category.userId === userId ||
      (category.teamId &&
        (await prisma.teamMember.findUnique({
          where: { userId_teamId: { userId, teamId: category.teamId } },
        })));
    if (!hasAccess) {
      return { success: false, error: ActionErrors.CATEGORY_ACCESS_DENIED };
    }
  }

  try {
    const task = await prisma.task.create({
      data: {
        ...data,
        creatorId: userId,
      },
      include: TASK_INCLUDE,
    });

    return { success: true, data: task as TaskWithRelations };
  } catch {
    return { success: false, error: ActionErrors.DATABASE_ERROR };
  }
}

export async function updateTask(
  taskId: string,
  formData: FormData,
): Promise<ActionResult<TaskWithRelations>> {
  const ownerResult = await requireTaskOwnership(taskId);
  if (!ownerResult.success) return ownerResult;

  const { userId } = ownerResult.data;

  const raw = {
    title: formData.get("title") || undefined,
    description: formData.get("description") || null,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    dueDate: formData.get("dueDate") || null,
    categoryId: formData.get("categoryId") || null,
    assigneeId: formData.get("assigneeId") || null,
    teamId: formData.get("teamId") || null,
    updatedAt: formData.get("updatedAt") || undefined,
  };

  const parsed = updateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updatedAt, ...data } = parsed.data;

  // If teamId provided, verify user is a member
  if (data.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: data.teamId } },
    });
    if (!membership) {
      return { success: false, error: ActionErrors.TEAM_ACCESS_DENIED };
    }
  }

  // If categoryId provided, verify access
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { userId: true, teamId: true },
    });
    if (!category) {
      return { success: false, error: ActionErrors.CATEGORY_NOT_FOUND };
    }
    const hasAccess =
      category.userId === userId ||
      (category.teamId &&
        (await prisma.teamMember.findUnique({
          where: { userId_teamId: { userId, teamId: category.teamId } },
        })));
    if (!hasAccess) {
      return { success: false, error: ActionErrors.CATEGORY_ACCESS_DENIED };
    }
  }

  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: TASK_INCLUDE,
    });

    return { success: true, data: task as TaskWithRelations };
  } catch {
    return { success: false, error: ActionErrors.DATABASE_ERROR };
  }
}

export async function deleteTask(
  taskId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const ownerResult = await requireTaskOwnership(taskId);
  if (!ownerResult.success) return ownerResult;

  try {
    await prisma.task.delete({ where: { id: taskId } });
    return { success: true, data: { deleted: true } };
  } catch {
    return { success: false, error: ActionErrors.DATABASE_ERROR };
  }
}

export async function toggleTaskStatus(
  taskId: string,
  formData: FormData,
): Promise<ActionResult<TaskWithRelations>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId } = authResult.data;

  const raw = {
    status: formData.get("status"),
    updatedAt: formData.get("updatedAt"),
  };

  const parsed = toggleTaskStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  // Fetch task with access check
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { creatorId: true, assigneeId: true, teamId: true, updatedAt: true },
  });

  if (!task) {
    return { success: false, error: ActionErrors.TASK_NOT_FOUND };
  }

  // Check access: creator, assignee, or team member (MEMBER+)
  let hasAccess = task.creatorId === userId || task.assigneeId === userId;

  if (!hasAccess && task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: task.teamId } },
    });
    hasAccess =
      !!membership &&
      (membership.role === "OWNER" || membership.role === "MEMBER");
  }

  if (!hasAccess) {
    return { success: false, error: ActionErrors.TASK_ACCESS_DENIED };
  }

  // Optimistic concurrency check: updatedAt must match
  if (task.updatedAt.getTime() !== parsed.data.updatedAt.getTime()) {
    return { success: false, error: ActionErrors.CONFLICT };
  }

  try {
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: parsed.data.status,
        updatedAt: new Date(),
      },
      include: TASK_INCLUDE,
    });

    return { success: true, data: updated as TaskWithRelations };
  } catch {
    return { success: false, error: ActionErrors.DATABASE_ERROR };
  }
}

export async function getTasks(
  params: Record<string, string>,
): Promise<ActionResult<PaginationResult<TaskWithRelations>>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId } = authResult.data;

  const parsed = taskFiltersSchema.safeParse(params);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  const {
    status,
    priority,
    categoryId,
    assigneeId,
    search,
    teamId,
    cursor,
    sortField,
    sortOrder,
    limit,
  } = parsed.data;

  // Build where clause
  const where: Record<string, unknown> = {};

  // If teamId provided, verify user is a member
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!membership) {
      return { success: false, error: ActionErrors.TEAM_ACCESS_DENIED };
    }
    where.teamId = teamId;
  } else {
    // Only show user's own tasks (personal) or tasks where they're assignee
    where.OR = [{ creatorId: userId }, { assigneeId: userId }];
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (categoryId) where.categoryId = categoryId;
  if (assigneeId) where.assigneeId = assigneeId;

  // Full-text search across title and description (parameterized, no N+1)
  if (search) {
    const searchCondition = {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    };
    if (where.OR) {
      where.AND = [{ OR: where.OR }, searchCondition];
      delete where.OR;
    } else {
      Object.assign(where, searchCondition);
    }
  }

  // Build orderBy
  const orderBy: Record<string, unknown> =
    sortField === "priority"
      ? { priority: sortOrder }
      : { [sortField]: sortOrder };

  // Cursor-based pagination
  const tasks = await prisma.task.findMany({
    where,
    include: TASK_INCLUDE,
    orderBy,
    take: limit + 1, // Fetch one extra to check if there's more
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = tasks.length > limit;
  const data = hasMore ? tasks.slice(0, limit) : tasks;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return {
    success: true,
    data: {
      data: data as TaskWithRelations[],
      nextCursor,
      hasMore,
    },
  };
}

export async function getTask(
  taskId: string,
): Promise<ActionResult<TaskWithRelations>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId } = authResult.data;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: TASK_INCLUDE,
  });

  if (!task) {
    return { success: false, error: ActionErrors.TASK_NOT_FOUND };
  }

  // IDOR check: user must be creator, assignee, or team member
  let hasAccess = task.creatorId === userId || task.assigneeId === userId;

  if (!hasAccess && task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: task.teamId } },
    });
    hasAccess = !!membership;
  }

  if (!hasAccess) {
    return { success: false, error: ActionErrors.TASK_ACCESS_DENIED };
  }

  return { success: true, data: task as TaskWithRelations };
}
