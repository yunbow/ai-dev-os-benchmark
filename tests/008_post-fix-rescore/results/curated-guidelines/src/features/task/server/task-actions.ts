"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  actionSuccess,
  actionFailure,
  actionForbidden,
  actionNotFound,
  actionInternalError,
  actionValidationError,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskFiltersSchema,
  ToggleTaskStatusSchema,
} from "@/features/task/schema/task-schema";
import {
  fetchTasks,
  fetchTaskById,
  canMutateTask,
  taskInclude,
  type TaskWithRelations,
} from "@/features/task/services/task-service";

export async function createTask(
  rawInput: unknown
): Promise<ActionResult<TaskWithRelations>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  const parsed = CreateTaskSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(e.message);
    });
    return actionValidationError("Invalid input", fieldErrors);
  }

  const { title, description, status, priority, dueDate, categoryId, assigneeId, teamId } =
    parsed.data;

  try {
    // Verify team membership if teamId provided
    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
      });
      if (!membership) {
        return actionForbidden();
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        status,
        priority,
        dueDate: dueDate ?? null,
        creatorId: userId,
        categoryId: categoryId ?? null,
        assigneeId: assigneeId ?? null,
        teamId: teamId ?? null,
      },
      include: taskInclude,
    });

    return actionSuccess(task);
  } catch {
    return actionInternalError();
  }
}

export async function listTasks(
  rawInput: unknown
): Promise<
  ActionResult<{
    tasks: TaskWithRelations[];
    nextCursor: string | null;
    hasMore: boolean;
  }>
> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  const parsed = TaskFiltersSchema.safeParse(rawInput);
  if (!parsed.success) {
    return actionValidationError("Invalid filters");
  }

  try {
    const result = await fetchTasks(userId, parsed.data);
    return actionSuccess(result);
  } catch {
    return actionInternalError();
  }
}

export async function getTask(
  taskId: unknown
): Promise<ActionResult<TaskWithRelations>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  if (typeof taskId !== "string") {
    return actionValidationError("Invalid task ID");
  }

  try {
    const task = await fetchTaskById(taskId, userId);
    if (!task) return actionNotFound("Task");
    return actionSuccess(task);
  } catch {
    return actionInternalError();
  }
}

export async function updateTask(
  taskId: unknown,
  rawInput: unknown
): Promise<ActionResult<TaskWithRelations>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  if (typeof taskId !== "string") {
    return actionValidationError("Invalid task ID");
  }

  const parsed = UpdateTaskSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(e.message);
    });
    return actionValidationError("Invalid input", fieldErrors);
  }

  try {
    const canMutate = await canMutateTask(taskId, userId);
    if (!canMutate) return actionForbidden();

    const { updatedAt: expectedUpdatedAt, ...updateData } = parsed.data;

    // Optimistic concurrency control
    if (expectedUpdatedAt) {
      const current = await prisma.task.findUnique({
        where: { id: taskId },
        select: { updatedAt: true },
      });
      if (!current) return actionNotFound("Task");
      if (current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        return actionFailure({
          code: "CONFLICT",
          message: "Task was modified by another user. Please refresh and try again.",
        });
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...updateData,
        description: updateData.description ?? undefined,
        dueDate: updateData.dueDate ?? undefined,
        categoryId: updateData.categoryId ?? undefined,
        assigneeId: updateData.assigneeId ?? undefined,
      },
      include: taskInclude,
    });

    return actionSuccess(task);
  } catch {
    return actionInternalError();
  }
}

export async function deleteTask(
  taskId: unknown
): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  if (typeof taskId !== "string") {
    return actionValidationError("Invalid task ID");
  }

  try {
    const canMutate = await canMutateTask(taskId, userId);
    if (!canMutate) return actionForbidden();

    await prisma.task.delete({ where: { id: taskId } });
    return actionSuccess(undefined);
  } catch {
    return actionInternalError();
  }
}

export async function toggleTaskStatus(
  rawInput: unknown
): Promise<ActionResult<TaskWithRelations>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  const parsed = ToggleTaskStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return actionValidationError("Invalid input");
  }

  const { taskId, newStatus, updatedAt: expectedUpdatedAt } = parsed.data;

  try {
    // Verify access
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
          { team: { members: { some: { userId } } } },
        ],
      },
      select: { id: true, updatedAt: true },
    });

    if (!task) return actionNotFound("Task");

    // Optimistic concurrency check
    if (task.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      return actionFailure({
        code: "CONFLICT",
        message: "Task was modified by another user. Please refresh and try again.",
      });
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
      include: taskInclude,
    });

    return actionSuccess(updated);
  } catch {
    return actionInternalError();
  }
}
