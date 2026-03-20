import { TeamRole } from "@prisma/client";
import { prisma } from "./prisma";
import { ActionErrors, ActionFailure } from "./action-helpers";

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

const ROLE_RANK: Record<TeamRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  OWNER: 2,
};

export function hasMinimumRole(userRole: TeamRole, minimumRole: TeamRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimumRole];
}

// ─── IDOR Prevention ──────────────────────────────────────────────────────────

/**
 * Verify the requesting user owns the resource.
 * Returns ActionFailure if ownership check fails.
 */
export function checkOwnership(
  resourceUserId: string,
  sessionUserId: string
): ActionFailure | null {
  if (resourceUserId !== sessionUserId) {
    return ActionErrors.forbidden();
  }
  return null;
}

// ─── Team Permission Helpers ──────────────────────────────────────────────────

export async function getTeamMembership(teamId: string, userId: string) {
  return prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
}

/**
 * Verify the user is an active team member with at least the minimum role.
 * Returns the TeamMember record on success, or an ActionFailure.
 */
export async function requireTeamRole(
  teamId: string,
  userId: string,
  minimumRole: TeamRole = "VIEWER"
): Promise<{ member: NonNullable<Awaited<ReturnType<typeof getTeamMembership>>> } | ActionFailure> {
  const member = await getTeamMembership(teamId, userId);

  if (!member) {
    return ActionErrors.forbidden();
  }

  if (!hasMinimumRole(member.role, minimumRole)) {
    return ActionErrors.forbidden();
  }

  return { member };
}

/**
 * Check if user can modify a task (creator or team admin).
 */
export async function canModifyTask(
  task: { userId: string; teamId: string | null },
  sessionUserId: string
): Promise<boolean> {
  // Task creator can always modify their own task
  if (task.userId === sessionUserId) return true;

  // Team admin/owner can modify any team task
  if (task.teamId) {
    const member = await getTeamMembership(task.teamId, sessionUserId);
    if (member && hasMinimumRole(member.role, "OWNER")) return true;
  }

  return false;
}
