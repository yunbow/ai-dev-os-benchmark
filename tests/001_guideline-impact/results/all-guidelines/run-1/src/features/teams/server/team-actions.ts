"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  withAction,
  requireAuth,
  requireTeamMember,
  createActionSuccess,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import {
  createTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  type CreateTeamInput,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
} from "../schema/team-schema";
import { sendTeamInvitationEmail } from "@/lib/email";
import type { Team, TeamMember, TeamRole, Prisma } from "@prisma/client";

type TeamWithMembers = Team & {
  members: (TeamMember & {
    user: { id: string; name: string | null; email: string; image: string | null };
  })[];
  _count: { members: number; tasks: number };
};

export async function createTeam(
  input: CreateTeamInput
): Promise<ActionResult<Team>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const team = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const newTeam = await tx.team.create({
          data: {
            name: validData!.name,
            ownerId: authResult.userId,
          },
        });

        // Add creator as OWNER
        await tx.teamMember.create({
          data: {
            teamId: newTeam.id,
            userId: authResult.userId,
            role: "OWNER",
          },
        });

        return newTeam;
      });

      return createActionSuccess(team);
    },
    { data: input, schema: createTeamSchema }
  );
}

export async function getTeam(
  teamId: string
): Promise<ActionResult<TeamWithMembers>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const memberResult = await requireTeamMember(teamId, authResult.userId);
    if (!memberResult.success) return memberResult;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        _count: { select: { members: true, tasks: true } },
      },
    });

    if (!team) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Team not found" },
      };
    }

    return createActionSuccess(team);
  });
}

export async function listUserTeams(): Promise<ActionResult<
  (Team & { role: TeamRole; _count: { members: number; tasks: number } })[]
>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const memberships = await prisma.teamMember.findMany({
      where: { userId: authResult.userId },
      include: {
        team: {
          include: {
            _count: { select: { members: true, tasks: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const teams = memberships.map((m: typeof memberships[number]) => ({
      ...m.team,
      role: m.role,
    }));

    return createActionSuccess(teams);
  });
}

export async function inviteTeamMember(
  teamId: string,
  input: InviteMemberInput
): Promise<ActionResult<{ message: string }>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const memberResult = await requireTeamMember(teamId, authResult.userId, [
        "OWNER",
      ]);
      if (!memberResult.success) return memberResult;

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          owner: { select: { name: true } },
        },
      });

      if (!team) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Team not found" },
        };
      }

      const { email, role } = validData!;

      // Check if user is already a member
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        const existingMember = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId, userId: existingUser.id } },
        });
        if (existingMember) {
          return {
            success: false,
            error: {
              code: "CONFLICT",
              message: "This user is already a member of the team",
            },
          };
        }
      }

      // Invalidate existing pending invitations for this email
      await prisma.teamInvitation.updateMany({
        where: { teamId, email, usedAt: null },
        data: { usedAt: new Date() },
      });

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await prisma.teamInvitation.create({
        data: {
          teamId,
          email,
          role,
          token,
          senderId: authResult.userId,
          expiresAt,
        },
      });

      await sendTeamInvitationEmail(
        email,
        team.name,
        team.owner.name ?? "Someone",
        token
      );

      return createActionSuccess({
        message: `Invitation sent to ${email}`,
      });
    },
    { data: input, schema: inviteMemberSchema }
  );
}

export async function acceptInvitation(
  token: string
): Promise<ActionResult<{ teamId: string }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
    });

    if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
      return {
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "This invitation is invalid or has expired",
        },
      };
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: authResult.userId,
          role: invitation.role,
        },
      });

      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      });
    });

    return createActionSuccess({ teamId: invitation.teamId });
  });
}

export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<ActionResult<void>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    // Only owner can remove members (or members can remove themselves)
    if (authResult.userId !== userId) {
      const memberResult = await requireTeamMember(teamId, authResult.userId, [
        "OWNER",
      ]);
      if (!memberResult.success) return memberResult;
    }

    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!member) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Team member not found" },
      };
    }

    // Cannot remove the owner
    if (member.role === "OWNER") {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Cannot remove the team owner",
        },
      };
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });

    return createActionSuccess(undefined);
  });
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  input: UpdateMemberRoleInput
): Promise<ActionResult<TeamMember>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const memberResult = await requireTeamMember(teamId, authResult.userId, [
        "OWNER",
      ]);
      if (!memberResult.success) return memberResult;

      const targetMember = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
      });

      if (!targetMember) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Team member not found" },
        };
      }

      if (targetMember.role === "OWNER") {
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Cannot change the owner's role",
          },
        };
      }

      const updated = await prisma.teamMember.update({
        where: { teamId_userId: { teamId, userId } },
        data: { role: validData!.role },
      });

      return createActionSuccess(updated);
    },
    { data: input, schema: updateMemberRoleSchema }
  );
}
