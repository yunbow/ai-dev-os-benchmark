import { prisma } from "@/lib/prisma";
import { TeamRole } from "@prisma/client";

export type TeamWithMemberCount = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { members: number };
  userRole: TeamRole | null;
};

export async function getUserTeams(userId: string): Promise<TeamWithMemberCount[]> {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    ...m.team,
    userRole: m.role,
  }));
}

export async function getTeamWithMembers(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { members: true, tasks: true } },
    },
  });
}

export async function getUserTeamRole(
  teamId: string,
  userId: string
): Promise<TeamRole | null> {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  });
  return member?.role ?? null;
}

export async function assertTeamMembership(
  teamId: string,
  userId: string,
  requiredRole?: TeamRole
): Promise<{ allowed: boolean; role: TeamRole | null }> {
  const role = await getUserTeamRole(teamId, userId);

  if (!role) {
    return { allowed: false, role: null };
  }

  if (requiredRole) {
    const roleHierarchy: Record<TeamRole, number> = {
      OWNER: 3,
      MEMBER: 2,
      VIEWER: 1,
    };

    if (roleHierarchy[role] < roleHierarchy[requiredRole]) {
      return { allowed: false, role };
    }
  }

  return { allowed: true, role };
}

export function canManageTeam(role: TeamRole): boolean {
  return role === TeamRole.OWNER;
}

export function canWriteTasks(role: TeamRole): boolean {
  return role === TeamRole.OWNER || role === TeamRole.MEMBER;
}

export function canReadTeam(role: TeamRole): boolean {
  return true; // All roles can read
}
