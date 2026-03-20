"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import {
  withAction,
  requireAuth,
  createActionSuccess,
  ActionErrors,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendTeamInvitationEmail } from "@/lib/email";
import {
  CreateTeamSchema,
  InviteMemberSchema,
  AcceptInvitationSchema,
  UpdateMemberRoleSchema,
  RemoveMemberSchema,
  DeleteTeamSchema,
  type CreateTeamInput,
  type InviteMemberInput,
  type AcceptInvitationInput,
  type UpdateMemberRoleInput,
  type RemoveMemberInput,
  type DeleteTeamInput,
} from "../schema/team-schema";
import type { TeamWithMembers } from "../types/team-types";
import { TeamRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

async function requireTeamOwner(
  teamId: string,
  userId: string
): Promise<{ success: true } | { success: false; error: { code: string; message: string } }> {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!member || member.role !== TeamRole.OWNER) {
    return ActionErrors.forbidden("Only team owners can perform this action");
  }
  return { success: true };
}

const TEAM_INCLUDE = {
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
  _count: { select: { members: true } },
} as const;

export async function createTeam(data: CreateTeamInput): Promise<ActionResult<TeamWithMembers>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const team = await prisma.$transaction(async (tx) => {
        const newTeam = await tx.team.create({
          data: {
            name: validData.name,
            ownerId: authResult.userId,
          },
        });

        await tx.teamMember.create({
          data: {
            teamId: newTeam.id,
            userId: authResult.userId,
            role: TeamRole.OWNER,
          },
        });

        return tx.team.findUniqueOrThrow({
          where: { id: newTeam.id },
          include: TEAM_INCLUDE,
        });
      });

      revalidatePath("/teams");
      return createActionSuccess(team as TeamWithMembers);
    },
    { data, schema: CreateTeamSchema }
  );
}

export async function getTeam(teamId: string): Promise<ActionResult<TeamWithMembers>> {
  return withAction(
    async () => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: authResult.userId } },
      });
      if (!membership) return ActionErrors.forbidden();

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: TEAM_INCLUDE,
      });
      if (!team) return ActionErrors.notFound("Team");

      return createActionSuccess(team as TeamWithMembers);
    },
    {}
  );
}

export async function listTeams(): Promise<ActionResult<TeamWithMembers[]>> {
  return withAction(
    async () => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const teams = await prisma.team.findMany({
        where: {
          members: { some: { userId: authResult.userId } },
        },
        include: TEAM_INCLUDE,
        orderBy: { createdAt: "desc" },
      });

      return createActionSuccess(teams as TeamWithMembers[]);
    },
    {}
  );
}

export async function inviteMember(data: InviteMemberInput): Promise<ActionResult<void>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
      const { success: rateLimitOk } = await checkRateLimit(
        `invite:${authResult.userId}`,
        RATE_LIMITS.invite
      );
      if (!rateLimitOk) return ActionErrors.rateLimit();

      const ownerResult = await requireTeamOwner(validData.teamId, authResult.userId);
      if (!ownerResult.success) return ownerResult;

      // Check if already a member
      const existingUser = await prisma.user.findUnique({
        where: { email: validData.email },
      });
      if (existingUser) {
        const existingMember = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId: validData.teamId, userId: existingUser.id } },
        });
        if (existingMember) {
          return ActionErrors.conflict("This user is already a team member");
        }
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await prisma.teamInvitation.create({
        data: {
          teamId: validData.teamId,
          email: validData.email,
          token,
          role: validData.role,
          invitedBy: authResult.userId,
          expiresAt,
        },
        include: {
          team: { select: { name: true } },
          inviter: { select: { name: true, email: true } },
        },
      });

      const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
      const inviteLink = `${baseUrl}/invitations/accept?token=${token}`;

      sendTeamInvitationEmail({
        to: validData.email,
        teamName: invitation.team.name,
        inviterName: invitation.inviter.name ?? invitation.inviter.email,
        inviteLink,
      }).catch((err) => console.error("Failed to send invitation email:", err));

      return createActionSuccess(undefined);
    },
    { data, schema: InviteMemberSchema }
  );
}

export async function acceptInvitation(data: AcceptInvitationInput): Promise<ActionResult<{ teamId: string }>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const invitation = await prisma.teamInvitation.findUnique({
        where: { token: validData.token },
        include: { team: true },
      });

      if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
        return ActionErrors.validation({ token: ["Invalid or expired invitation token"] });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: authResult.userId },
      });

      if (currentUser?.email !== invitation.email) {
        return ActionErrors.forbidden("This invitation was sent to a different email address");
      }

      await prisma.$transaction([
        prisma.teamMember.upsert({
          where: { teamId_userId: { teamId: invitation.teamId, userId: authResult.userId } },
          create: {
            teamId: invitation.teamId,
            userId: authResult.userId,
            role: invitation.role,
          },
          update: { role: invitation.role },
        }),
        prisma.teamInvitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        }),
      ]);

      revalidatePath("/teams");
      return createActionSuccess({ teamId: invitation.teamId });
    },
    { data, schema: AcceptInvitationSchema }
  );
}

export async function updateMemberRole(data: UpdateMemberRoleInput): Promise<ActionResult<void>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const ownerResult = await requireTeamOwner(validData.teamId, authResult.userId);
      if (!ownerResult.success) return ownerResult;

      if (validData.userId === authResult.userId) {
        return ActionErrors.validation({ role: ["You cannot change your own role"] });
      }

      await prisma.teamMember.update({
        where: { teamId_userId: { teamId: validData.teamId, userId: validData.userId } },
        data: { role: validData.role },
      });

      revalidatePath(`/teams/${validData.teamId}`);
      return createActionSuccess(undefined);
    },
    { data, schema: UpdateMemberRoleSchema }
  );
}

export async function removeMember(data: RemoveMemberInput): Promise<ActionResult<void>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const ownerResult = await requireTeamOwner(validData.teamId, authResult.userId);
      if (!ownerResult.success) return ownerResult;

      if (validData.userId === authResult.userId) {
        return ActionErrors.validation({ userId: ["You cannot remove yourself from the team"] });
      }

      await prisma.teamMember.delete({
        where: { teamId_userId: { teamId: validData.teamId, userId: validData.userId } },
      });

      revalidatePath(`/teams/${validData.teamId}`);
      return createActionSuccess(undefined);
    },
    { data, schema: RemoveMemberSchema }
  );
}

export async function deleteTeam(data: DeleteTeamInput): Promise<ActionResult<void>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const ownerResult = await requireTeamOwner(validData.teamId, authResult.userId);
      if (!ownerResult.success) return ownerResult;

      await prisma.team.delete({ where: { id: validData.teamId } });

      revalidatePath("/teams");
      return createActionSuccess(undefined);
    },
    { data, schema: DeleteTeamSchema }
  );
}
