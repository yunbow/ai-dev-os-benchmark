"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/auth/require-auth";
import { withAction, ActionResult, ActionErrors } from "@/lib/actions/action-helpers";
import {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  acceptInvitationSchema,
  updateMemberRoleSchema,
  CreateTeamInput,
  UpdateTeamInput,
  InviteMemberInput,
  AcceptInvitationInput,
  UpdateMemberRoleInput,
} from "../schema/team-schema";
import { Team, TeamMember, TeamRole } from "@prisma/client";
import { sendTeamInvitationEmail } from "@/lib/email/email";

type TeamWithMemberCount = Team & { _count: { members: number } };
type TeamMemberWithUser = TeamMember & {
  user: { id: string; name: string | null; email: string; image: string | null };
};

async function requireTeamRole(
  userId: string,
  teamId: string,
  minRole: TeamRole
): Promise<{ success: true; membership: TeamMember } | ReturnType<typeof ActionErrors.forbidden>> {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!membership) return ActionErrors.notFound("Team");

  const ROLE_RANK: Record<TeamRole, number> = { OWNER: 3, MEMBER: 2, VIEWER: 1 };
  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) return ActionErrors.forbidden();

  return { success: true, membership };
}

export async function createTeamAction(data: CreateTeamInput): Promise<ActionResult<Team>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const team = await prisma.$transaction(async (tx) => {
        const newTeam = await tx.team.create({
          data: { name: validData!.name, ownerId: authResult.userId },
        });
        await tx.teamMember.create({
          data: { teamId: newTeam.id, userId: authResult.userId, role: "OWNER" },
        });
        return newTeam;
      });

      return { success: true, data: team };
    },
    { data, schema: createTeamSchema }
  );
}

export async function listTeamsAction(): Promise<ActionResult<TeamWithMemberCount[]>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const teams = await prisma.team.findMany({
      where: { members: { some: { userId: authResult.userId } } },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: teams };
  });
}

export async function updateTeamAction(
  teamId: string,
  data: UpdateTeamInput
): Promise<ActionResult<Team>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const access = await requireTeamRole(authResult.userId, teamId, "OWNER");
      if (!access.success) return access;

      const team = await prisma.team.update({ where: { id: teamId }, data: validData! });
      return { success: true, data: team };
    },
    { data, schema: updateTeamSchema }
  );
}

export async function deleteTeamAction(teamId: string): Promise<ActionResult<void>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const access = await requireTeamRole(authResult.userId, teamId, "OWNER");
    if (!access.success) return access;

    await prisma.team.delete({ where: { id: teamId } });
    return { success: true, data: undefined };
  });
}

export async function listTeamMembersAction(
  teamId: string
): Promise<ActionResult<TeamMemberWithUser[]>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const access = await requireTeamRole(authResult.userId, teamId, "VIEWER");
    if (!access.success) return access;

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { joinedAt: "asc" },
    });

    return { success: true, data: members };
  });
}

export async function inviteTeamMemberAction(
  teamId: string,
  data: InviteMemberInput
): Promise<ActionResult<void>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const access = await requireTeamRole(authResult.userId, teamId, "OWNER");
      if (!access.success) return access;

      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) return ActionErrors.notFound("Team");

      const existing = await prisma.user.findUnique({ where: { email: validData!.email } });
      if (existing) {
        const alreadyMember = await prisma.teamMember.findUnique({
          where: { userId_teamId: { userId: existing.id, teamId } },
        });
        if (alreadyMember) return ActionErrors.conflict("This user is already a team member");
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.teamInvitation.create({
        data: { teamId, email: validData!.email, token, role: validData!.role, expiresAt },
      });

      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/teams/invite?token=${token}`;
      await sendTeamInvitationEmail(validData!.email, team.name, inviteUrl);

      return { success: true, data: undefined };
    },
    { data, schema: inviteMemberSchema }
  );
}

export async function acceptTeamInvitationAction(
  data: AcceptInvitationInput
): Promise<ActionResult<{ teamId: string }>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const invitation = await prisma.teamInvitation.findUnique({
        where: { token: validData!.token },
      });

      if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
        return { success: false, error: { code: "INVALID_TOKEN", message: "This invitation link is invalid or has expired" } };
      }

      await prisma.$transaction([
        prisma.teamMember.create({
          data: { teamId: invitation.teamId, userId: authResult.userId, role: invitation.role },
        }),
        prisma.teamInvitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        }),
      ]);

      return { success: true, data: { teamId: invitation.teamId } };
    },
    { data, schema: acceptInvitationSchema }
  );
}

export async function updateMemberRoleAction(
  teamId: string,
  memberId: string,
  data: UpdateMemberRoleInput
): Promise<ActionResult<TeamMember>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const access = await requireTeamRole(authResult.userId, teamId, "OWNER");
      if (!access.success) return access;

      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (team?.ownerId === memberId) {
        return ActionErrors.forbidden();
      }

      const member = await prisma.teamMember.update({
        where: { id: memberId },
        data: { role: validData!.role },
      });

      return { success: true, data: member };
    },
    { data, schema: updateMemberRoleSchema }
  );
}

export async function removeTeamMemberAction(
  teamId: string,
  memberId: string
): Promise<ActionResult<void>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const access = await requireTeamRole(authResult.userId, teamId, "OWNER");
    if (!access.success) return access;

    const memberToRemove = await prisma.teamMember.findUnique({ where: { id: memberId } });
    if (!memberToRemove || memberToRemove.teamId !== teamId) return ActionErrors.notFound("Member");

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (team?.ownerId === memberToRemove.userId) return ActionErrors.forbidden();

    await prisma.teamMember.delete({ where: { id: memberId } });
    return { success: true, data: undefined };
  });
}
