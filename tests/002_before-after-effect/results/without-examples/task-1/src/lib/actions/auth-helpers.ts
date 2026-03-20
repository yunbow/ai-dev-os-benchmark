import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ActionErrors } from "@/lib/errors";
import type { ActionResult, AuthResult, TaskWithRelations } from "@/lib/types";
import { TeamRole } from "@prisma/client";

// Require authenticated session
export async function requireAuth(): Promise<
  ActionResult<AuthResult>
> {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    return {
      success: false,
      error: ActionErrors.UNAUTHORIZED,
    };
  }

  return {
    success: true,
    data: {
      userId: session.user.id,
      email: session.user.email,
    },
  };
}

// IDOR prevention: verify user owns or has access to the task
export async function requireTaskOwnership(
  taskId: string,
): Promise<ActionResult<{ userId: string; email: string; task: TaskWithRelations }>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId, email } = authResult.data;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
      category: {
        select: { id: true, name: true, color: true },
      },
    },
  });

  if (!task) {
    return {
      success: false,
      error: ActionErrors.TASK_NOT_FOUND,
    };
  }

  // Check if user is the creator
  if (task.creatorId === userId) {
    return {
      success: true,
      data: { userId, email, task: task as TaskWithRelations },
    };
  }

  // Check if user is a team admin/owner for team tasks
  if (task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: { userId, teamId: task.teamId },
      },
    });

    if (membership && membership.role === TeamRole.OWNER) {
      return {
        success: true,
        data: { userId, email, task: task as TaskWithRelations },
      };
    }
  }

  return {
    success: false,
    error: ActionErrors.TASK_ACCESS_DENIED,
  };
}

// IDOR prevention: verify user is an active team member with sufficient role
export async function requireTeamMembership(
  teamId: string,
  minRole: TeamRole = TeamRole.VIEWER,
): Promise<
  ActionResult<{
    userId: string;
    email: string;
    membership: {
      id: string;
      userId: string;
      teamId: string;
      role: TeamRole;
      joinedAt: Date;
      user: { id: string; name: string | null; email: string; image: string | null };
      team: { id: string; name: string; createdAt: Date; updatedAt: Date };
    };
  }>
> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId, email } = authResult.data;

  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: { userId, teamId },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      team: {
        select: { id: true, name: true, createdAt: true, updatedAt: true },
      },
    },
  });

  if (!membership) {
    return {
      success: false,
      error: ActionErrors.TEAM_ACCESS_DENIED,
    };
  }

  // Role hierarchy: OWNER > MEMBER > VIEWER
  const roleOrder: Record<TeamRole, number> = {
    [TeamRole.OWNER]: 3,
    [TeamRole.MEMBER]: 2,
    [TeamRole.VIEWER]: 1,
  };

  if (roleOrder[membership.role] < roleOrder[minRole]) {
    return {
      success: false,
      error: ActionErrors.FORBIDDEN,
    };
  }

  return {
    success: true,
    data: { userId, email, membership },
  };
}

// Verify user owns a category
export async function requireCategoryOwnership(
  categoryId: string,
): Promise<
  ActionResult<{
    userId: string;
    email: string;
    category: { id: string; name: string; color: string; userId: string | null; teamId: string | null };
  }>
> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId, email } = authResult.data;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, color: true, userId: true, teamId: true },
  });

  if (!category) {
    return {
      success: false,
      error: ActionErrors.CATEGORY_NOT_FOUND,
    };
  }

  // Personal category
  if (category.userId === userId) {
    return {
      success: true,
      data: { userId, email, category },
    };
  }

  // Team category - check if user is team owner
  if (category.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: { userId, teamId: category.teamId },
      },
    });

    if (membership && membership.role === TeamRole.OWNER) {
      return {
        success: true,
        data: { userId, email, category },
      };
    }
  }

  return {
    success: false,
    error: ActionErrors.CATEGORY_ACCESS_DENIED,
  };
}
