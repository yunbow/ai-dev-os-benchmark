import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ActionErrors } from "@/types";
import type { Team, Task } from "@prisma/client";

// IDOR prevention: verify team ownership
export async function requireTeamOwnership(
  teamId: string,
): Promise<
  | { success: false; error: string }
  | { success: true; user: { id: string; email: string; name: string; role: string }; team: Team }
> {
  const authResult = await requireAuth();
  if (!authResult.success) return { success: false, error: ActionErrors.unauthorized() };

  const team = await prisma.team.findUnique({ where: { id: teamId } });

  if (!team) {
    return { success: false, error: ActionErrors.notFound("Team") };
  }

  if (team.ownerId !== authResult.user.id) {
    console.warn(
      `IDOR attempt: user ${authResult.user.id} tried to access team ${teamId} owned by ${team.ownerId}`,
    );
    return { success: false, error: ActionErrors.forbidden() };
  }

  return { success: true, user: authResult.user, team };
}

// IDOR prevention: verify team membership (owner or member)
export async function requireTeamMembership(
  teamId: string,
): Promise<
  | { success: false; error: string }
  | { success: true; user: { id: string; email: string; name: string; role: string }; team: Team }
> {
  const authResult = await requireAuth();
  if (!authResult.success) return { success: false, error: ActionErrors.unauthorized() };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) {
    return { success: false, error: ActionErrors.notFound("Team") };
  }

  const isMember =
    team.ownerId === authResult.user.id ||
    team.members.some((m) => m.userId === authResult.user.id);

  if (!isMember) {
    console.warn(
      `IDOR attempt: user ${authResult.user.id} tried to access team ${teamId}`,
    );
    return { success: false, error: ActionErrors.forbidden() };
  }

  return { success: true, user: authResult.user, team };
}

// IDOR prevention: verify task ownership
export async function requireTaskOwnership(
  taskId: string,
): Promise<
  | { success: false; error: string }
  | { success: true; user: { id: string; email: string; name: string; role: string }; task: Task }
> {
  const authResult = await requireAuth();
  if (!authResult.success) return { success: false, error: ActionErrors.unauthorized() };

  const task = await prisma.task.findUnique({ where: { id: taskId } });

  if (!task) {
    return { success: false, error: ActionErrors.notFound("Task") };
  }

  if (task.userId !== authResult.user.id) {
    console.warn(
      `IDOR attempt: user ${authResult.user.id} tried to access task ${taskId} owned by ${task.userId}`,
    );
    return { success: false, error: ActionErrors.forbidden() };
  }

  return { success: true, user: authResult.user, task };
}
