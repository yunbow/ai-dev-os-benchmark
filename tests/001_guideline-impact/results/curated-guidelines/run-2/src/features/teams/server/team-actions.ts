"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { withAction, requireAuth, ActionResult } from "@/lib/actions/action-helpers";
import { ActionErrors } from "@/lib/actions/errors";
import {
  CreateTeamSchema,
  UpdateTeamSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  CreateTeamInput,
  UpdateTeamInput,
  InviteMemberInput,
  UpdateMemberRoleInput,
} from "../schema/team-schema";
import { sendTeamInvitationEmail } from "@/lib/email";
import { Team, TeamMember, TeamMemberRole } from "@prisma/client";

type TeamWithMembers = Team & {
  members: (TeamMember & {
    user: { id: string; name: string | null; email: string };
  })[];
};

export async function createTeam(
  input: CreateTeamInput
): Promise<ActionResult<TeamWithMembers>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const parsed = CreateTeamSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    const team = await prisma.team.create({
      data: {
        name: parsed.data.name,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return { success: true, data: team };
  });
}

export async function getTeams(): Promise<ActionResult<TeamWithMembers[]>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const teams = await prisma.team.findMany({
      where: {
        members: { some: { userId: session.user.id } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: teams };
  });
}

export async function getTeam(id: string): Promise<ActionResult<TeamWithMembers>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!team) {
      return { success: false, error: ActionErrors.notFound("Team") };
    }

    const isMember = team.members.some((m) => m.userId === session.user.id);
    if (!isMember) {
      return { success: false, error: ActionErrors.forbidden() };
    }

    return { success: true, data: team };
  });
}

export async function updateTeam(
  id: string,
  input: UpdateTeamInput
): Promise<ActionResult<Team>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: id, userId: session.user.id } },
    });

    if (!membership) {
      return { success: false, error: ActionErrors.notFound("Team") };
    }

    if (membership.role !== "OWNER") {
      return { success: false, error: ActionErrors.forbidden() };
    }

    const parsed = UpdateTeamSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    const team = await prisma.team.update({
      where: { id },
      data: parsed.data,
    });

    return { success: true, data: team };
  });
}

export async function deleteTeam(id: string): Promise<ActionResult<{ id: string }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: id, userId: session.user.id } },
    });

    if (!membership || membership.role !== "OWNER") {
      return { success: false, error: ActionErrors.forbidden() };
    }

    await prisma.team.delete({ where: { id } });

    return { success: true, data: { id } };
  });
}

export async function inviteMember(
  teamId: string,
  input: InviteMemberInput
): Promise<ActionResult<{ message: string }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
      include: { team: true },
    });

    if (!membership) {
      return { success: false, error: ActionErrors.notFound("Team") };
    }

    if (membership.role !== "OWNER" && membership.role !== "MEMBER") {
      return { success: false, error: ActionErrors.forbidden() };
    }

    const parsed = InviteMemberSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    const { email, role } = parsed.data;

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: existingUser.id } },
      });
      if (existingMember) {
        return { success: false, error: ActionErrors.conflict("User is already a team member.") };
      }
    }

    // Invalidate existing invitations
    await prisma.teamInvitation.updateMany({
      where: { teamId, email, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.teamInvitation.create({
      data: { teamId, email, token, role, expiresAt },
    });

    const inviter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    await sendTeamInvitationEmail(
      email,
      membership.team.name,
      inviter?.name ?? inviter?.email ?? "A team member",
      token
    );

    return { success: true, data: { message: "Invitation sent successfully." } };
  });
}

export async function acceptInvitation(
  token: string
): Promise<ActionResult<{ teamId: string }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const invitation = await prisma.teamInvitation.findUnique({ where: { token } });

    if (!invitation) {
      return { success: false, error: ActionErrors.badRequest("Invalid invitation token.") };
    }

    if (invitation.usedAt || new Date() > invitation.expiresAt) {
      return { success: false, error: ActionErrors.badRequest("This invitation has expired or already been used.") };
    }

    // Verify email matches
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.email !== invitation.email) {
      return {
        success: false,
        error: ActionErrors.forbidden(),
      };
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: invitation.teamId, userId: session.user.id } },
    });

    if (existingMember) {
      await prisma.teamInvitation.update({
        where: { token },
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
      prisma.teamInvitation.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true, data: { teamId: invitation.teamId } };
  });
}

export async function removeMember(
  teamId: string,
  memberId: string
): Promise<ActionResult<{ id: string }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const requesterMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });

    if (!requesterMembership) {
      return { success: false, error: ActionErrors.forbidden() };
    }

    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId, teamId },
    });

    if (!targetMember) {
      return { success: false, error: ActionErrors.notFound("Team member") };
    }

    // Can remove self, or OWNER can remove others
    const isSelf = targetMember.userId === session.user.id;
    if (!isSelf && requesterMembership.role !== "OWNER") {
      return { success: false, error: ActionErrors.forbidden() };
    }

    // Cannot remove the last owner
    if (targetMember.role === "OWNER") {
      const ownerCount = await prisma.teamMember.count({
        where: { teamId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return {
          success: false,
          error: ActionErrors.conflict("Cannot remove the last owner of a team."),
        };
      }
    }

    await prisma.teamMember.delete({ where: { id: memberId } });

    return { success: true, data: { id: memberId } };
  });
}

export async function updateMemberRole(
  teamId: string,
  memberId: string,
  input: UpdateMemberRoleInput
): Promise<ActionResult<TeamMember>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const requesterMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });

    if (!requesterMembership || requesterMembership.role !== "OWNER") {
      return { success: false, error: ActionErrors.forbidden() };
    }

    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId, teamId },
    });

    if (!targetMember) {
      return { success: false, error: ActionErrors.notFound("Team member") };
    }

    const parsed = UpdateMemberRoleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    // Cannot demote last owner
    if (targetMember.role === "OWNER" && parsed.data.role !== "OWNER") {
      const ownerCount = await prisma.teamMember.count({
        where: { teamId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return {
          success: false,
          error: ActionErrors.conflict("Cannot demote the last owner."),
        };
      }
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role: parsed.data.role },
    });

    return { success: true, data: updated };
  });
}
