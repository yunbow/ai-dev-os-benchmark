"use server";

import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/auth/session";
import {
  ActionResult,
  ActionErrors,
  createSuccess,
  createFailure,
} from "@/lib/actions/types";
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksSchema,
} from "@/features/tasks/schema";
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "@/features/tasks/services/task-service";
import { TeamRole } from "@prisma/client";

async function verifyTaskAccess(
  taskId: string,
  userId: string,
  requireOwnerOrAdmin = false
): Promise<{ allowed: boolean; reason?: string }> {
  const task = await getTask(taskId);
  if (!task) return { allowed: false, reason: "Task not found" };

  if (task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: task.teamId, userId } },
    });
    if (!membership) return { allowed: false, reason: "Not a team member" };
    if (requireOwnerOrAdmin) {
      const isOwner = task.creatorId === userId;
      const isAdmin = membership.role === TeamRole.OWNER;
      if (!isOwner && !isAdmin) return { allowed: false, reason: "Insufficient permissions" };
    }
    return { allowed: true };
  }

  if (task.creatorId !== userId && task.assigneeId !== userId) {
    return { allowed: false, reason: "Access denied" };
  }
  if (requireOwnerOrAdmin && task.creatorId !== userId) {
    return { allowed: false, reason: "Only the task creator can modify this task" };
  }

  return { allowed: true };
}

export async function listTasksAction(input: unknown): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const parsed = listTasksSchema.safeParse(input);
  if (!parsed.success) return createFailure(parsed.error.issues[0].message);

  const result = await listTasks(authResult.user.id, parsed.data);
  return createSuccess(result);
}

export async function createTaskAction(input: unknown): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return createFailure(parsed.error.issues[0].message);

  const task = await createTask(authResult.user.id, parsed.data);
  return createSuccess(task);
}

export async function updateTaskAction(
  taskId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const access = await verifyTaskAccess(taskId, authResult.user.id, true);
  if (!access.allowed) return ActionErrors.forbidden();

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) return createFailure(parsed.error.issues[0].message);

  const task = await updateTask(taskId, parsed.data);
  return createSuccess(task);
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const access = await verifyTaskAccess(taskId, authResult.user.id, true);
  if (!access.allowed) return ActionErrors.forbidden();

  await deleteTask(taskId);
  return createSuccess(undefined);
}

export async function toggleTaskStatusAction(
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "DONE",
  currentUpdatedAt: Date
): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const task = await getTask(taskId);
  if (!task) return ActionErrors.notFound("Task");

  const access = await verifyTaskAccess(taskId, authResult.user.id);
  if (!access.allowed) return ActionErrors.forbidden();

  if (task.updatedAt.getTime() !== new Date(currentUpdatedAt).getTime()) {
    return createFailure("Task was modified by another user", "CONFLICT");
  }

  const updated = await updateTask(taskId, { status });
  return createSuccess(updated);
}
