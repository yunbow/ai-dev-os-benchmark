"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ActionErrors, ActionResult, createActionSuccess } from "./types";
import type { Task, TeamMember, User } from "@prisma/client";

export type AuthResult =
  | { success: true; user: User }
  | { success: false; error: ReturnType<typeof ActionErrors.unauthorized> };

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: ActionErrors.unauthorized() };
  }
  // Re-fetch user from DB to ensure up-to-date data
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { success: false, error: ActionErrors.unauthorized() };
  }
  return { success: true, user };
}

export type TaskOwnershipResult =
  | { success: true; user: User; task: Task }
  | { success: false; error: { code: string; message: string } };

/**
 * Verifies that the authenticated user owns or has team access to the task.
 * SEC-09: IDOR prevention — verify resource ownership on every mutating request.
 */
export async function requireTaskAccess(
  taskId: string
): Promise<TaskOwnershipResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { user } = authResult;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { team: { include: { members: true } } },
  });

  if (!task) {
    return { success: false, error: ActionErrors.notFound("Task") };
  }

  // Personal task: must be the owner
  if (!task.teamId) {
    if (task.userId !== user.id) {
      logger.warn(
        { userId: user.id, taskId, ownerId: task.userId },
        "IDOR attempt detected: user tried to access another user's personal task"
      );
      return { success: false, error: ActionErrors.forbidden() };
    }
    return { success: true, user, task };
  }

  // Team task: must be a member of the team
  const isMember = task.team?.members.some(
    (m: TeamMember) => m.userId === user.id
  );
  if (!isMember) {
    logger.warn(
      { userId: user.id, taskId, teamId: task.teamId },
      "IDOR attempt detected: user tried to access a task from a team they don't belong to"
    );
    return { success: false, error: ActionErrors.forbidden() };
  }

  return { success: true, user, task };
}
