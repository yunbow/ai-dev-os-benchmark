"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  ActionResult,
  ActionErrors,
  createActionSuccess,
} from "./types";
import type { Task, User, TeamMember } from "@prisma/client";

export type AuthResult =
  | { success: true; user: User }
  | ReturnType<typeof ActionErrors.unauthorized>;

/**
 * Verify the current session and return the authenticated user.
 * All server actions must call this first.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return ActionErrors.unauthorized();
  }
  // Re-fetch from DB to get the full user object and confirm they still exist
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return ActionErrors.unauthorized();
  }
  return createActionSuccess(user) as AuthResult;
}

// ----- Task ownership helpers -----

export type TaskOwnershipResult =
  | { success: true; user: User; task: Task }
  | ReturnType<typeof ActionErrors.unauthorized>
  | ReturnType<typeof ActionErrors.forbidden>
  | ReturnType<typeof ActionErrors.notFound>;

/**
 * Verify that the requesting user has the right to operate on a task.
 *
 * Access is granted when EITHER:
 *   1. The task belongs directly to the user (personal task), OR
 *   2. The task belongs to a team of which the user is a member (team task).
 *
 * Any other access attempt is an IDOR violation and is logged + rejected.
 */
export async function requireTaskAccess(
  taskId: string
): Promise<TaskOwnershipResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const user = (authResult as { success: true; user: User }).user;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    return ActionErrors.notFound("Task");
  }

  // Personal task — direct ownership check
  if (task.userId === user.id) {
    return { success: true, user, task };
  }

  // Team task — verify membership
  if (task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId: task.teamId, userId: user.id },
      },
    });

    if (membership) {
      return { success: true, user, task };
    }
  }

  // IDOR attempt: user has no legitimate claim to this task
  logger.warn(
    {
      requestingUserId: user.id,
      taskId,
      taskOwnerId: task.userId,
      taskTeamId: task.teamId ?? null,
    },
    "IDOR attempt detected: user tried to access another user's task"
  );

  return ActionErrors.forbidden();
}

/**
 * Like requireTaskAccess but additionally enforces that only the original
 * creator (userId) can perform destructive operations on personal tasks,
 * and only team admins/owners can perform them on team tasks.
 */
export async function requireTaskWriteAccess(
  taskId: string
): Promise<TaskOwnershipResult> {
  const accessResult = await requireTaskAccess(taskId);
  if (!accessResult.success) return accessResult;

  const { user, task } = accessResult as { success: true; user: User; task: Task };

  // Personal task — only the owner may write
  if (!task.teamId) {
    if (task.userId !== user.id) {
      logger.warn(
        { requestingUserId: user.id, taskId, taskOwnerId: task.userId },
        "IDOR attempt: user tried to write to another user's personal task"
      );
      return ActionErrors.forbidden();
    }
    return { success: true, user, task };
  }

  // Team task — check for admin/owner role
  const membership: TeamMember | null = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId: task.teamId, userId: user.id },
    },
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    logger.warn(
      {
        requestingUserId: user.id,
        taskId,
        taskTeamId: task.teamId,
        memberRole: membership?.role ?? "none",
      },
      "Authorization failure: insufficient role for team task write operation"
    );
    return ActionErrors.forbidden();
  }

  return { success: true, user, task };
}
