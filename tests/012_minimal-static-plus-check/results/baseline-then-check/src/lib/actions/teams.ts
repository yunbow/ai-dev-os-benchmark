"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  acceptInvitationSchema,
  type CreateTeamInput,
  type UpdateTeamInput,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
} from "@/lib/validations";
import type { ActionResult } from "@/lib/utils";
import { generateToken } from "@/lib/utils";
import { sendTeamInvitationEmail } from "@/lib/email";
import { Team, TeamMember, Invitation, TeamRole } from "@prisma/client";

type TeamWithMembers = Team & {
  members: (TeamMember & {
    user: { id: string; name: string | null; email: string; image: string | null };
  })[];
  _count: { tasks: number };
};

async function verifyTeamRole(
  teamId: string,
  userId: string,
  requiredRole: "OWNER" | "MEMBER" | "VIEWER" = "MEMBER"
): Promise<{ membership: TeamMember | null; hasRole: boolean }> {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!membership) return { membership: null, hasRole: false };

  const roleHierarchy = { OWNER: 3, MEMBER: 2, VIEWER: 1 };
  const userLevel = roleHierarchy[membership.role] ?? 0;
  const requiredLevel = roleHierarchy[requiredRole] ?? 0;

  return { membership, hasRole: userLevel >= requiredLevel };
}

export async function createTeam(
  input: CreateTeamInput
): Promise<ActionResult<TeamWithMembers>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createTeamSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { name, description } = parsed.data;

  const team = await prisma.team.create({
    data: {
      name,
      description,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      _count: { select: { tasks: true } },
    },
  });

  return { success: true, data: team as TeamWithMembers };
}

export async function updateTeam(
  input: UpdateTeamInput
): Promise<ActionResult<Team>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateTeamSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { id, ...data } = parsed.data;

  const { hasRole } = await verifyTeamRole(id, session.user.id, "OWNER");
  if (!hasRole) {
    return { success: false, error: "Only team owners can update team settings" };
  }

  const team = await prisma.team.update({
    where: { id },
    data,
  });

  return { success: true, data: team };
}

export async function deleteTeam(teamId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const { hasRole } = await verifyTeamRole(teamId, session.user.id, "OWNER");
  if (!hasRole) {
    return { success: false, error: "Only team owners can delete teams" };
  }

  await prisma.team.delete({ where: { id: teamId } });

  return { success: true, data: undefined };
}

export async function getTeams(): Promise<ActionResult<TeamWithMembers[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const teams = await prisma.team.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { name: "asc" },
  });

  return { success: true, data: teams as TeamWithMembers[] };
}

export async function getTeam(
  teamId: string
): Promise<ActionResult<TeamWithMembers>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const { membership } = await verifyTeamRole(teamId, session.user.id, "VIEWER");
  if (!membership) {
    return { success: false, error: "Team not found" };
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!team) return { success: false, error: "Team not found" };

  return { success: true, data: team as TeamWithMembers };
}

export async function inviteMember(
  input: InviteMemberInput
): Promise<ActionResult<Invitation>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { teamId, email, role } = parsed.data;

  const { hasRole } = await verifyTeamRole(teamId, session.user.id, "MEMBER");
  if (!hasRole) {
    return { success: false, error: "Insufficient permissions" };
  }

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: existingUser.id } },
    });
    if (existingMember) {
      return { success: false, error: "User is already a team member" };
    }
  }

  // Invalidate previous invitations for this email/team
  await prisma.invitation.updateMany({
    where: { teamId, email, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.create({
    data: {
      teamId,
      email,
      role: role as TeamRole,
      token,
      senderId: session.user.id,
      expiresAt,
    },
  });

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  const sender = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  try {
    await sendTeamInvitationEmail(
      email,
      token,
      team?.name || "the team",
      sender?.name || "A team member"
    );
  } catch {
    // Don't expose email errors to the user
  }

  return { success: true, data: invitation };
}

export async function acceptInvitation(
  token: string
): Promise<ActionResult<{ teamId: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Please log in to accept the invitation" };
  }

  const parsed = acceptInvitationSchema.safeParse({ token });
  if (!parsed.success) {
    return { success: false, error: "Invalid invitation token" };
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return { success: false, error: "Invalid invitation" };
  }

  if (invitation.usedAt) {
    return { success: false, error: "This invitation has already been used" };
  }

  if (new Date() > invitation.expiresAt) {
    return { success: false, error: "This invitation has expired" };
  }

  // Check if user's email matches invitation
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!user || user.email !== invitation.email) {
    return {
      success: false,
      error: "This invitation was sent to a different email address",
    };
  }

  // Check if already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: invitation.teamId,
        userId: session.user.id,
      },
    },
  });

  if (existingMember) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });
    return { success: true, data: { teamId: invitation.teamId } };
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: session.user.id,
        role: invitation.role,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true, data: { teamId: invitation.teamId } };
}

export async function removeMember(
  teamId: string,
  userId: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const { membership: currentMembership } = await verifyTeamRole(
    teamId,
    session.user.id,
    "MEMBER"
  );

  if (!currentMembership) {
    return { success: false, error: "Team not found" };
  }

  // Can remove self or others if owner
  const isSelf = userId === session.user.id;
  const isOwner = currentMembership.role === "OWNER";

  if (!isSelf && !isOwner) {
    return {
      success: false,
      error: "Only team owners can remove other members",
    };
  }

  const targetMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });

  if (!targetMembership) {
    return { success: false, error: "Member not found" };
  }

  // Cannot remove the only owner
  if (targetMembership.role === "OWNER") {
    const ownerCount = await prisma.teamMember.count({
      where: { teamId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      return {
        success: false,
        error: "Cannot remove the only owner. Transfer ownership first.",
      };
    }
  }

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId } },
  });

  return { success: true, data: undefined };
}

export async function updateMemberRole(
  input: UpdateMemberRoleInput
): Promise<ActionResult<TeamMember>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { teamId, userId, role } = parsed.data;

  const { hasRole } = await verifyTeamRole(teamId, session.user.id, "OWNER");
  if (!hasRole) {
    return {
      success: false,
      error: "Only team owners can change member roles",
    };
  }

  // Prevent removing the last owner
  if (role !== "OWNER") {
    const targetMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (targetMembership?.role === "OWNER") {
      const ownerCount = await prisma.teamMember.count({
        where: { teamId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return {
          success: false,
          error: "Cannot demote the only owner. Assign another owner first.",
        };
      }
    }
  }

  const updated = await prisma.teamMember.update({
    where: { teamId_userId: { teamId, userId } },
    data: { role: role as TeamRole },
  });

  return { success: true, data: updated };
}
