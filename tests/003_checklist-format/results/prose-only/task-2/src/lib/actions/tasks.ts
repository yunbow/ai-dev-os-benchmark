"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  ActionResult,
  ActionErrors,
  createActionSuccess,
} from "./types";
import {
  requireAuth,
  requireTaskAccess,
  requireTaskWriteAccess,
} from "./auth-helpers";
import type { Task, User } from "@prisma/client";

// ---------------------------------------------------------------------------
// Input validation schemas (Zod) — validate every external input
// ---------------------------------------------------------------------------

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  dueDate: z.coerce.date().optional(),
  // teamId is optional; if provided, task is owned by the team
  teamId: z.string().cuid().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  completed: z.boolean().optional(),
});

type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

/**
 * Create a new task for the authenticated user.
 *
 * If `teamId` is supplied the task is associated with that team, but only
 * if the requesting user is actually a member of that team.
 */
export async function createTask(
  input: CreateTaskInput
): Promise<ActionResult<Task>> {
  // 1. Authenticate
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const user = (authResult as { success: true; user: User }).user;

  // 2. Validate input
  const parsed = CreateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return ActionErrors.validationError(parsed.error.errors[0].message);
  }
  const { title, description, dueDate, teamId } = parsed.data;

  // 3. If teamId provided, verify membership before associating
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: user.id } },
    });
    if (!membership) {
      logger.warn(
        { userId: user.id, teamId },
        "User tried to create a task for a team they do not belong to"
      );
      return ActionErrors.forbidden();
    }
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate,
        userId: user.id,
        teamId: teamId ?? null,
      },
    });
    return createActionSuccess(task);
  } catch (err) {
    logger.error({ err, userId: user.id }, "Failed to create task");
    return ActionErrors.internalError();
  }
}

// ---------------------------------------------------------------------------
// READ — single task
// ---------------------------------------------------------------------------

/**
 * Fetch a single task by ID.
 * Only the owner or a team member may read the task.
 */
export async function getTask(taskId: string): Promise<ActionResult<Task>> {
  // Validate input
  if (!taskId || typeof taskId !== "string") {
    return ActionErrors.validationError("Invalid task ID");
  }

  const accessResult = await requireTaskAccess(taskId);
  if (!accessResult.success) return accessResult;

  return createActionSuccess(
    (accessResult as { success: true; task: Task }).task
  );
}

// ---------------------------------------------------------------------------
// READ — list
// ---------------------------------------------------------------------------

/**
 * List all tasks visible to the authenticated user:
 *   - Personal tasks (userId === current user)
 *   - Team tasks for every team the user belongs to
 *
 * Filtering is done in the WHERE clause so users never see tasks they do
 * not own or are not team-members of (IDOR prevention by design).
 */
export async function listTasks(): Promise<ActionResult<Task[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const user = (authResult as { success: true; user: User }).user;

  try {
    // Gather team IDs the user belongs to
    const memberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      select: { teamId: true },
    });
    const teamIds = memberships.map((m) => m.teamId);

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          // Personal tasks
          { userId: user.id, teamId: null },
          // Team tasks for teams the user is a member of
          ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return createActionSuccess(tasks);
  } catch (err) {
    logger.error({ err, userId: user.id }, "Failed to list tasks");
    return ActionErrors.internalError();
  }
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

/**
 * Update a task.
 *
 * For personal tasks: only the task owner may update.
 * For team tasks: only team OWNER or ADMIN may update.
 */
export async function updateTask(
  taskId: string,
  input: UpdateTaskInput
): Promise<ActionResult<Task>> {
  // 1. Validate inputs
  if (!taskId || typeof taskId !== "string") {
    return ActionErrors.validationError("Invalid task ID");
  }
  const parsed = UpdateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return ActionErrors.validationError(parsed.error.errors[0].message);
  }

  // 2. Authorise — includes IDOR check
  const accessResult = await requireTaskWriteAccess(taskId);
  if (!accessResult.success) return accessResult;

  const { data } = parsed;

  try {
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
        ...(data.completed !== undefined && { completed: data.completed }),
      },
    });
    return createActionSuccess(updated);
  } catch (err) {
    logger.error({ err, taskId }, "Failed to update task");
    return ActionErrors.internalError();
  }
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

/**
 * Delete a task.
 *
 * For personal tasks: only the task owner may delete.
 * For team tasks: only team OWNER or ADMIN may delete.
 */
export async function deleteTask(taskId: string): Promise<ActionResult<void>> {
  // 1. Validate input
  if (!taskId || typeof taskId !== "string") {
    return ActionErrors.validationError("Invalid task ID");
  }

  // 2. Authorise — includes IDOR check
  const accessResult = await requireTaskWriteAccess(taskId);
  if (!accessResult.success) return accessResult;

  try {
    await prisma.task.delete({ where: { id: taskId } });
    return createActionSuccess(undefined);
  } catch (err) {
    logger.error({ err, taskId }, "Failed to delete task");
    return ActionErrors.internalError();
  }
}
