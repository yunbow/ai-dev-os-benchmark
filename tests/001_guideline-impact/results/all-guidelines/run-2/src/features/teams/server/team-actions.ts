"use server";

import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import {
  ActionErrors,
  createActionSuccess,
  handleActionError,
  requireAuth,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import {
  CreateTeamSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  type CreateTeamInput,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
} from "../schema/team-schema";
import { sendTeamInvitationEmail } from "@/lib/email";
import { TeamRole } from "@prisma/client";

type TeamWithMembers = {
  id: string;
  name: string;
  createdAt: Date;
  ownerId: string;
  members: Array<{
    id: string;
    role: TeamRole;
    joinedAt: Date;
    user: { id: string; name: string | null; email: string; image: string | null };
  }>;
};

async function requireTeamOwner(teamId: string, userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (!member || member.role !== "OWNER") return ActionErrors.forbidden();
  return null;
}

async function requireTeamMember(teamId: string, userId: string, minRole?: TeamRole) {
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (!member) return ActionErrors.forbidden();
  if (minRole === "OWNER" && member.role !== "OWNER") return ActionErrors.forbidden();
  if (minRole === "MEMBER" && member.role === "VIEWER") return ActionErrors.forbidden();
  return null;
}

export async function createTeamAction(input: CreateTeamInput): Promise<ActionResult<TeamWithMembers>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const validated = CreateTeamSchema.parse(input);

    const team = await prisma.team.create({
      data: {
        name: validated.name,
        ownerId: authResult.userId,
        members: {
          create: {
            userId: authResult.userId,
            role: "OWNER",
          },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });

    return createActionSuccess(team as unknown as TeamWithMembers);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getTeamsAction(): Promise<ActionResult<(TeamWithMembers & { _count: { members: number; tasks: number } })[]>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const teams = await prisma.team.findMany({
      where: {
        members: { some: { userId: authResult.userId } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { members: true, tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return createActionSuccess(teams as any);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getTeamAction(teamId: string): Promise<ActionResult<{ team: TeamWithMembers & { _count: { tasks: number } }; currentUserId: string }>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const forbidden = await requireTeamMember(teamId, authResult.userId);
    if (forbidden) return forbidden;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!team) return ActionErrors.notFound("Team");
    return createActionSuccess({ team: team as any, currentUserId: authResult.userId });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteTeamAction(teamId: string): Promise<ActionResult<void>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const forbidden = await requireTeamOwner(teamId, authResult.userId);
    if (forbidden) return forbidden;

    await prisma.team.delete({ where: { id: teamId } });
    return createActionSuccess(undefined);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function inviteMemberAction(input: InviteMemberInput): Promise<ActionResult<void>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const validated = InviteMemberSchema.parse(input);

    const forbidden = await requireTeamOwner(validated.teamId, authResult.userId);
    if (forbidden) return forbidden;

    const team = await prisma.team.findUnique({
      where: { id: validated.teamId },
      include: { owner: { select: { name: true } } },
    });
    if (!team) return ActionErrors.notFound("Team");

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existingUser) {
      const existingMember = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: existingUser.id, teamId: validated.teamId } },
      });
      if (existingMember) {
        return ActionErrors.conflict("This user is already a team member");
      }
    }

    // Invalidate existing pending invitations for this email+team
    await prisma.teamInvitation.updateMany({
      where: { email: validated.email, teamId: validated.teamId, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.teamInvitation.create({
      data: {
        email: validated.email,
        token,
        role: validated.role,
        expiresAt,
        teamId: validated.teamId,
        inviterId: authResult.userId,
      },
    });

    await sendTeamInvitationEmail(
      validated.email,
      team.name,
      team.owner.name || "A team member",
      token
    );

    return createActionSuccess(undefined);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function acceptInvitationAction(token: string): Promise<ActionResult<{ teamId: string }>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const invitation = await prisma.teamInvitation.findUnique({ where: { token } });

    if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
      return {
        success: false,
        error: { code: "INVALID_TOKEN", message: "This invitation is invalid or has expired" },
      };
    }

    // Verify email matches
    const user = await prisma.user.findUnique({ where: { id: authResult.userId } });
    if (!user || user.email !== invitation.email) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "This invitation was sent to a different email address" },
      };
    }

    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          userId: authResult.userId,
          teamId: invitation.teamId,
          role: invitation.role,
        },
      }),
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return createActionSuccess({ teamId: invitation.teamId });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function removeMemberAction(teamId: string, userId: string): Promise<ActionResult<void>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    // Can remove self or owner can remove others
    if (userId !== authResult.userId) {
      const forbidden = await requireTeamOwner(teamId, authResult.userId);
      if (forbidden) return forbidden;
    }

    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!member) return ActionErrors.notFound("Team member");
    if (member.role === "OWNER") {
      return ActionErrors.conflict("Cannot remove the team owner. Transfer ownership first.");
    }

    await prisma.teamMember.delete({ where: { userId_teamId: { userId, teamId } } });
    return createActionSuccess(undefined);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateMemberRoleAction(input: UpdateMemberRoleInput): Promise<ActionResult<void>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const validated = UpdateMemberRoleSchema.parse(input);

    const forbidden = await requireTeamOwner(validated.teamId, authResult.userId);
    if (forbidden) return forbidden;

    if (validated.role === "OWNER") {
      return ActionErrors.conflict("Use transfer ownership to change the owner");
    }

    await prisma.teamMember.update({
      where: { userId_teamId: { userId: validated.userId, teamId: validated.teamId } },
      data: { role: validated.role },
    });

    return createActionSuccess(undefined);
  } catch (error) {
    return handleActionError(error);
  }
}
