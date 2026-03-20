"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ActionErrors, ActionResult, createActionSuccess } from "./types";
import { requireAuth, requireTaskAccess } from "./auth-helpers";
import type { Task } from "@prisma/client";

// SEC-03: Require Zod validation for all input data

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(10000).optional(),
  teamId: z.string().cuid().optional(),
  dueAt: z.coerce.date().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(10000).optional(),
  completed: z.boolean().optional(),
  dueAt: z.coerce.date().optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

export async function createTask(
  input: unknown
): Promise<ActionResult<Task>> {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const parsed = CreateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: ActionErrors.validation(parsed.error.issues[0].message),
    };
  }

  const { user } = authResult;
  const { title, description, teamId, dueAt } = parsed.data;

  // If assigning to a team, verify the user is a member (SEC-09)
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: user.id } },
    });
    if (!membership) {
      logger.warn(
        { userId: user.id, teamId },
        "User attempted to create a task in a team they do not belong to"
      );
      return { success: false, error: ActionErrors.forbidden() };
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      dueAt,
      userId: user.id,
      teamId: teamId ?? null,
    },
  });

  return createActionSuccess(task);
}

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------

/**
 * Returns all tasks visible to the authenticated user:
 * their personal tasks plus tasks from teams they belong to.
 */
export async function getTasks(): Promise<ActionResult<Task[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  const { user } = authResult;

  // Fetch team IDs the user belongs to
  const memberships = await prisma.teamMember.findMany({
    where: { userId: user.id },
    select: { teamId: true },
  });
  const teamIds = memberships.map((m) => m.teamId);

  // SEC-09: filter by ownership / team membership in the WHERE clause
  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { userId: user.id, teamId: null },
        { teamId: { in: teamIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return createActionSuccess(tasks);
}

export async function getTask(taskId: string): Promise<ActionResult<Task>> {
  // requireTaskAccess already handles auth + IDOR check
  const result = await requireTaskAccess(taskId);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return createActionSuccess(result.task);
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

export async function updateTask(
  taskId: string,
  input: unknown
): Promise<ActionResult<Task>> {
  // SEC-09: verify ownership before mutation
  const accessResult = await requireTaskAccess(taskId);
  if (!accessResult.success) {
    return { success: false, error: accessResult.error };
  }

  const parsed = UpdateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: ActionErrors.validation(parsed.error.issues[0].message),
    };
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...parsed.data,
      updatedAt: new Date(),
    },
  });

  return createActionSuccess(updated);
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

export async function deleteTask(
  taskId: string
): Promise<ActionResult<{ id: string }>> {
  // SEC-09: verify ownership before mutation
  const accessResult = await requireTaskAccess(taskId);
  if (!accessResult.success) {
    return { success: false, error: accessResult.error };
  }

  await prisma.task.delete({ where: { id: taskId } });

  return createActionSuccess({ id: taskId });
}
