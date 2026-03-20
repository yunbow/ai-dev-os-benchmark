"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import type { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth/session";
import {
  ActionResult,
  ActionErrors,
  createSuccess,
  createFailure,
} from "@/lib/actions/types";
import {
  createTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "@/features/teams/schema";
import { sendTeamInvitationEmail } from "@/lib/email";
import { TeamRole } from "@prisma/client";

async function requireTeamOwner(teamId: string, userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!member || member.role !== TeamRole.OWNER) return null;
  return member;
}

async function requireTeamMember(teamId: string, userId: string) {
  return prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
}

export async function createTeamAction(input: unknown): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const parsed = createTeamSchema.safeParse(input);
  if (!parsed.success) return createFailure(parsed.error.issues[0].message);

  const team = await prisma.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
    const t = await tx.team.create({ data: parsed.data });
    await tx.teamMember.create({
      data: { teamId: t.id, userId: authResult.user.id, role: TeamRole.OWNER },
    });
    return t;
  });

  return createSuccess(team);
}

export async function listTeamsAction(): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId: authResult.user.id } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return createSuccess(teams);
}

export async function getTeamAction(teamId: string): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const member = await requireTeamMember(teamId, authResult.user.id);
  if (!member) return ActionErrors.forbidden();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!team) return ActionErrors.notFound("Team");
  return createSuccess(team);
}

export async function inviteMemberAction(
  teamId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const owner = await requireTeamOwner(teamId, authResult.user.id);
  if (!owner) return ActionErrors.forbidden();

  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) return createFailure(parsed.error.issues[0].message);

  const { email, role } = parsed.data;

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return ActionErrors.notFound("Team");

  // Invalidate existing invitations for this email+team
  await prisma.teamInvitation.updateMany({
    where: { teamId, email, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.teamInvitation.create({
    data: {
      teamId,
      email,
      role,
      token,
      expiresAt,
      invitedBy: authResult.user.id,
    },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL}/teams/accept-invite?token=${token}`;
  await sendTeamInvitationEmail(email, team.name, inviteUrl);

  return createSuccess(undefined);
}

export async function acceptInvitationAction(token: string): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const invitation = await prisma.teamInvitation.findUnique({ where: { token } });
  if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
    return createFailure("Invalid or expired invitation", "INVALID_TOKEN");
  }

  // Check if user is already a member
  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: invitation.teamId, userId: authResult.user.id } },
  });
  if (existing) {
    return createFailure("You are already a member of this team", "ALREADY_MEMBER");
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: authResult.user.id,
        role: invitation.role,
      },
    }),
    prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return createSuccess(invitation.teamId);
}

export async function removeMemberAction(
  teamId: string,
  memberId: string
): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const owner = await requireTeamOwner(teamId, authResult.user.id);
  if (!owner) return ActionErrors.forbidden();

  // Cannot remove yourself if you're the owner
  if (memberId === authResult.user.id) {
    return createFailure("Owner cannot remove themselves", "INVALID_OPERATION");
  }

  await prisma.teamMember.deleteMany({
    where: { teamId, userId: memberId },
  });

  return createSuccess(undefined);
}

export async function updateMemberRoleAction(
  teamId: string,
  memberId: string,
  input: unknown
): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const owner = await requireTeamOwner(teamId, authResult.user.id);
  if (!owner) return ActionErrors.forbidden();

  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) return createFailure(parsed.error.issues[0].message);

  await prisma.teamMember.update({
    where: { teamId_userId: { teamId, userId: memberId } },
    data: { role: parsed.data.role },
  });

  return createSuccess(undefined);
}

export async function deleteTeamAction(teamId: string): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const owner = await requireTeamOwner(teamId, authResult.user.id);
  if (!owner) return ActionErrors.forbidden();

  await prisma.team.delete({ where: { id: teamId } });
  return createSuccess(undefined);
}
