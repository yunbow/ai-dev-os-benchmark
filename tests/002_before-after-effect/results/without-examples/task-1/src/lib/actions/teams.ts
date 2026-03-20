"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ActionErrors } from "@/lib/errors";
import { requireAuth, requireTeamMembership } from "./auth-helpers";
import { createTeamSchema, updateTeamSchema, inviteMemberSchema, updateMemberRoleSchema } from "@/lib/validations/team";
import { sendInviteEmail } from "@/lib/email";
import type { ActionResult, TeamWithMembers } from "@/lib/types";
import { TeamRole } from "@prisma/client";

export async function createTeam(
  formData: FormData,
): Promise<ActionResult<TeamWithMembers>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId } = authResult.data;

  const raw = { name: formData.get("name") };

  const parsed = createTeamSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  try {
    // Create team and add creator as OWNER atomically
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: { name: parsed.data.name },
      });

      await tx.teamMember.create({
        data: {
          userId,
          teamId: newTeam.id,
          role: TeamRole.OWNER,
        },
      });

      return tx.team.findUnique({
        where: { id: newTeam.id },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
      });
    });

    return { success: true, data: team as TeamWithMembers };
  } catch {
    return { success: false, error: ActionErrors.DATABASE_ERROR };
  }
}

export async function updateTeam(
  teamId: string,
  formData: FormData,
): Promise<ActionResult<TeamWithMembers>> {
  // Only OWNER can update team
  const memberResult = await requireTeamMembership(teamId, TeamRole.OWNER);
  if (!memberResult.success) return memberResult;

  const raw = { name: formData.get("name") || undefined };

  const parsed = updateTeamSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  try {
    const team = await prisma.team.update({
      where: { id: teamId },
      data: parsed.data,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
    });

    return { success: true, data: team as TeamWithMembers };
  } catch {
    return { success: false, error: ActionErrors.DATABASE_ERROR };
  }
}

export async function deleteTeam(
  teamId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  // Only OWNER can delete team
  const memberResult = await requireTeamMembership(teamId, TeamRole.OWNER);
  if (!memberResult.success) return memberResult;

  try {
    await prisma.team.delete({ where: { id: teamId } });
    return { success: true, data: { deleted: true } };
  } catch {
    return { success: false, error: ActionErrors.DATABASE_ERROR };
  }
}

export async function getTeams(): Promise<ActionResult<TeamWithMembers[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId } = authResult.data;

  const teams = await prisma.team.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: teams as TeamWithMembers[] };
}

export async function getTeam(
  teamId: string,
): Promise<ActionResult<TeamWithMembers>> {
  // Verify membership (even VIEWER can view)
  const memberResult = await requireTeamMembership(teamId, TeamRole.VIEWER);
  if (!memberResult.success) return memberResult;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  if (!team) {
    return { success: false, error: ActionErrors.TEAM_NOT_FOUND };
  }

  return { success: true, data: team as TeamWithMembers };
}

export async function inviteTeamMember(
  teamId: string,
  formData: FormData,
): Promise<ActionResult<{ invited: boolean }>> {
  // Only OWNER or MEMBER can invite
  const memberResult = await requireTeamMembership(teamId, TeamRole.MEMBER);
  if (!memberResult.success) return memberResult;

  const { userId } = memberResult.data;

  const raw = {
    email: formData.get("email"),
    role: formData.get("role") || "MEMBER",
  };

  const parsed = inviteMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  const { email, role } = parsed.data;

  // IDOR: Only OWNER can invite as OWNER
  if (role === TeamRole.OWNER && memberResult.data.membership.role !== TeamRole.OWNER) {
    return { success: false, error: ActionErrors.FORBIDDEN };
  }

  // Check if already a member
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    const existingMembership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: existingUser.id, teamId } },
    });
    if (existingMembership) {
      return { success: false, error: ActionErrors.ALREADY_MEMBER };
    }
  }

  // Check for pending invitation
  const existingInvitation = await prisma.teamInvitation.findFirst({
    where: {
      teamId,
      email,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvitation) {
    return { success: false, error: ActionErrors.INVITATION_PENDING };
  }

  // Create secure single-use token
  const token = crypto.randomBytes(32).toString("hex");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });

  if (!team) {
    return { success: false, error: ActionErrors.TEAM_NOT_FOUND };
  }

  const inviter = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  await prisma.teamInvitation.create({
    data: {
      teamId,
      email,
      token,
      role,
      invitedById: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  try {
    await sendInviteEmail({
      email,
      inviterName: inviter?.name ?? inviter?.email ?? "A team member",
      teamName: team.name,
      token,
    });
  } catch {
    return { success: false, error: ActionErrors.EMAIL_ERROR };
  }

  return { success: true, data: { invited: true } };
}

export async function acceptTeamInvitation(
  token: string,
): Promise<ActionResult<{ joined: boolean }>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId } = authResult.data;

  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: { team: { select: { id: true, name: true } } },
  });

  if (!invitation) {
    return { success: false, error: ActionErrors.INVALID_TOKEN };
  }

  if (invitation.usedAt) {
    return { success: false, error: ActionErrors.TOKEN_USED };
  }

  if (invitation.expiresAt < new Date()) {
    return { success: false, error: ActionErrors.TOKEN_EXPIRED };
  }

  // Check if already a member
  const existingMembership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: invitation.teamId } },
  });

  if (existingMembership) {
    // Mark invitation as used even if already a member
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });
    return { success: false, error: ActionErrors.ALREADY_MEMBER };
  }

  await prisma.$transaction([
    prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    }),
    prisma.teamMember.create({
      data: {
        userId,
        teamId: invitation.teamId,
        role: invitation.role,
      },
    }),
  ]);

  return { success: true, data: { joined: true } };
}

export async function removeTeamMember(
  teamId: string,
  memberId: string,
): Promise<ActionResult<{ removed: boolean }>> {
  const memberResult = await requireTeamMembership(teamId, TeamRole.MEMBER);
  if (!memberResult.success) return memberResult;

  const { userId } = memberResult.data;
  const isOwner = memberResult.data.membership.role === TeamRole.OWNER;

  // IDOR: Only OWNER can remove others; MEMBER can only remove themselves
  if (memberId !== userId && !isOwner) {
    return { success: false, error: ActionErrors.FORBIDDEN };
  }

  // Cannot remove the team owner
  const targetMembership = await prisma.teamMember.findUnique({
    where: { id: memberId },
  });

  if (!targetMembership || targetMembership.teamId !== teamId) {
    return { success: false, error: ActionErrors.NOT_FOUND };
  }

  if (targetMembership.role === TeamRole.OWNER) {
    return { success: false, error: ActionErrors.CANNOT_REMOVE_OWNER };
  }

  await prisma.teamMember.delete({ where: { id: memberId } });

  return { success: true, data: { removed: true } };
}

export async function updateMemberRole(
  teamId: string,
  memberId: string,
  formData: FormData,
): Promise<ActionResult<{ updated: boolean }>> {
  // Only OWNER can update roles
  const memberResult = await requireTeamMembership(teamId, TeamRole.OWNER);
  if (!memberResult.success) return memberResult;

  const raw = { role: formData.get("role") };

  const parsed = updateMemberRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  const targetMembership = await prisma.teamMember.findUnique({
    where: { id: memberId },
  });

  if (!targetMembership || targetMembership.teamId !== teamId) {
    return { success: false, error: ActionErrors.NOT_FOUND };
  }

  // Cannot change owner's role
  if (targetMembership.role === TeamRole.OWNER) {
    return { success: false, error: ActionErrors.FORBIDDEN };
  }

  await prisma.teamMember.update({
    where: { id: memberId },
    data: { role: parsed.data.role },
  });

  return { success: true, data: { updated: true } };
}
