"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { withAction, requireAuth, ActionErrors, createSuccess, ActionResult } from "@/lib/actions/action-helpers";
import { createTeamSchema, inviteMemberSchema, CreateTeamInput, InviteMemberInput } from "@/features/teams/schema/team-schema";
import { Team, Prisma } from "@prisma/client";

type TeamWithMembers = Prisma.TeamGetPayload<{
  include: {
    members: {
      include: { user: { select: { id: true; name: true; email: true; image: true } } };
    };
  };
}>;

export async function createTeam(input: CreateTeamInput): Promise<ActionResult<Team>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const parsed = createTeamSchema.safeParse(input);
    if (!parsed.success) {
      return ActionErrors.validation(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const team = await prisma.team.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        members: {
          create: {
            userId: authResult.userId,
            role: "OWNER",
          },
        },
      },
    });

    return createSuccess(team);
  });
}

export async function getTeams(): Promise<ActionResult<TeamWithMembers[]>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const teams = await prisma.team.findMany({
      where: {
        members: { some: { userId: authResult.userId } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return createSuccess(teams);
  });
}

export async function inviteMember(teamId: string, input: InviteMemberInput): Promise<ActionResult<void>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: authResult.userId } },
    });

    if (!membership || membership.role !== "OWNER") {
      return ActionErrors.forbidden();
    }

    const parsed = inviteMemberSchema.safeParse(input);
    if (!parsed.success) {
      return ActionErrors.validation(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.teamInvitation.create({
      data: {
        email: parsed.data.email,
        token,
        role: parsed.data.role,
        teamId,
        expiresAt,
      },
    });

    // In production: send email with invitation link
    console.log(`Invitation link: /team/join?token=${token}`);

    return createSuccess(undefined);
  });
}

export async function joinTeam(token: string): Promise<ActionResult<void>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const invitation = await prisma.teamInvitation.findUnique({ where: { token } });

    if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
      return {
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invalid or expired invitation" },
      };
    }

    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: invitation.teamId, userId: authResult.userId } },
    });

    if (existing) {
      return ActionErrors.conflict("Already a member of this team");
    }

    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: authResult.userId,
          role: invitation.role,
        },
      }),
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return createSuccess(undefined);
  });
}

export async function removeMember(teamId: string, userId: string): Promise<ActionResult<void>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: authResult.userId } },
    });

    if (!membership || membership.role !== "OWNER") {
      return ActionErrors.forbidden();
    }

    // Cannot remove the owner
    const targetMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (targetMembership?.role === "OWNER") {
      return ActionErrors.conflict("Cannot remove the team owner");
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });

    return createSuccess(undefined);
  });
}
