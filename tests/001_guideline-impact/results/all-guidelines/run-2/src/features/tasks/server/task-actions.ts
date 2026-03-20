"use server";

import { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ActionErrors,
  createActionSuccess,
  handleActionError,
  requireAuth,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskFilterSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskFilterInput,
} from "../schema/task-schema";

type TaskWithRelations = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  creator: { id: string; name: string | null; email: string; image: string | null };
  assignee: { id: string; name: string | null; email: string; image: string | null } | null;
  category: { id: string; name: string; color: string } | null;
  teamId: string | null;
};

const TASK_INCLUDE = {
  creator: { select: { id: true, name: true, email: true, image: true } },
  assignee: { select: { id: true, name: true, email: true, image: true } },
  category: { select: { id: true, name: true, color: true } },
};

async function checkTaskPermission(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { team: { include: { members: { where: { userId } } } } },
  });

  if (!task) return { allowed: false, task: null, reason: "NOT_FOUND" as const };

  if (task.creatorId === userId) return { allowed: true, task, reason: null };

  if (task.teamId) {
    const member = task.team?.members[0];
    if (member && (member.role === "OWNER" || member.role === "MEMBER")) {
      return { allowed: true, task, reason: null };
    }
  }

  return { allowed: false, task, reason: "FORBIDDEN" as const };
}

export async function createTaskAction(input: CreateTaskInput): Promise<ActionResult<TaskWithRelations>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const validated = CreateTaskSchema.parse(input);

    // Verify team membership if teamId provided
    if (validated.teamId) {
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: authResult.userId, teamId: validated.teamId } },
      });
      if (!member) return ActionErrors.forbidden();
    }

    const task = await prisma.task.create({
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        creatorId: authResult.userId,
      },
      include: TASK_INCLUDE,
    });

    return createActionSuccess(task as TaskWithRelations);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateTaskAction(input: UpdateTaskInput): Promise<ActionResult<TaskWithRelations>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const validated = UpdateTaskSchema.parse(input);
    const { id, ...data } = validated;

    const permission = await checkTaskPermission(id, authResult.userId);
    if (!permission.allowed) {
      return permission.reason === "NOT_FOUND" ? ActionErrors.notFound("Task") : ActionErrors.forbidden();
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
      },
      include: TASK_INCLUDE,
    });

    return createActionSuccess(task as TaskWithRelations);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult<void>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const permission = await checkTaskPermission(taskId, authResult.userId);
    if (!permission.allowed) {
      return permission.reason === "NOT_FOUND" ? ActionErrors.notFound("Task") : ActionErrors.forbidden();
    }

    // Only creator or team owner/admin can delete
    const task = permission.task!;
    if (task.creatorId !== authResult.userId) {
      if (task.teamId) {
        const member = await prisma.teamMember.findUnique({
          where: { userId_teamId: { userId: authResult.userId, teamId: task.teamId } },
        });
        if (!member || member.role === "VIEWER" || member.role === "MEMBER") {
          return ActionErrors.forbidden();
        }
      } else {
        return ActionErrors.forbidden();
      }
    }

    await prisma.task.delete({ where: { id: taskId } });
    return createActionSuccess(undefined);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function toggleTaskStatusAction(
  taskId: string,
  expectedUpdatedAt: string
): Promise<ActionResult<TaskWithRelations>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return ActionErrors.notFound("Task");

    // Optimistic concurrency check
    if (task.updatedAt.toISOString() !== expectedUpdatedAt) {
      return {
        success: false,
        error: { code: "CONFLICT", message: "Task was modified by another user. Please refresh." },
      };
    }

    const permission = await checkTaskPermission(taskId, authResult.userId);
    if (!permission.allowed) return ActionErrors.forbidden();

    const nextStatus: Record<TaskStatus, TaskStatus> = {
      TODO: "IN_PROGRESS",
      IN_PROGRESS: "DONE",
      DONE: "TODO",
    };

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: nextStatus[task.status] },
      include: TASK_INCLUDE,
    });

    return createActionSuccess(updated as TaskWithRelations);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getTasksAction(filter: Partial<TaskFilterInput>): Promise<ActionResult<{
  tasks: TaskWithRelations[];
  nextCursor: string | null;
  hasMore: boolean;
}>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const validated = TaskFilterSchema.parse(filter);
    const { cursor, limit, search, sortBy, sortOrder, teamId, ...filters } = validated;

    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };

    const where: Record<string, unknown> = {
      ...filters,
      ...(teamId ? { teamId } : { creatorId: authResult.userId, teamId: null }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(cursor && { id: { lt: cursor } }),
    };

    const tasks = await prisma.task.findMany({
      where,
      take: limit + 1,
      orderBy: sortBy === "priority"
        ? [{ priority: sortOrder }, { createdAt: "desc" }]
        : [{ [sortBy]: sortOrder }],
      include: TASK_INCLUDE,
    });

    const hasMore = tasks.length > limit;
    const items = hasMore ? tasks.slice(0, limit) : tasks;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return createActionSuccess({ tasks: items as TaskWithRelations[], nextCursor, hasMore });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getTaskAction(taskId: string): Promise<ActionResult<TaskWithRelations>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: TASK_INCLUDE,
    });

    if (!task) return ActionErrors.notFound("Task");

    // Check visibility
    if (task.creatorId !== authResult.userId && task.assigneeId !== authResult.userId) {
      if (task.teamId) {
        const member = await prisma.teamMember.findUnique({
          where: { userId_teamId: { userId: authResult.userId, teamId: task.teamId } },
        });
        if (!member) return ActionErrors.forbidden();
      } else {
        return ActionErrors.forbidden();
      }
    }

    return createActionSuccess(task as TaskWithRelations);
  } catch (error) {
    return handleActionError(error);
  }
}
