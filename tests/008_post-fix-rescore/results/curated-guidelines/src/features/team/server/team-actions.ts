"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  actionSuccess,
  actionFailure,
  actionForbidden,
  actionNotFound,
  actionInternalError,
  actionValidationError,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import {
  CreateTeamSchema,
  UpdateTeamSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  AcceptInviteSchema,
} from "@/features/team/schema/team-schema";
import {
  getTeamWithMembers,
  getUserTeams,
  assertTeamMembership,
  type TeamWithMemberCount,
} from "@/features/team/services/team-service";
import { sendTeamInvitationEmail } from "@/lib/email";
import { TeamRole } from "@prisma/client";
import crypto from "crypto";

export async function createTeam(
  rawInput: unknown
): Promise<ActionResult<{ id: string; name: string }>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  const parsed = CreateTeamSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(e.message);
    });
    return actionValidationError("Invalid input", fieldErrors);
  }

  try {
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: { name: parsed.data.name, ownerId: userId },
        select: { id: true, name: true },
      });

      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId,
          role: TeamRole.OWNER,
        },
      });

      return newTeam;
    });

    return actionSuccess(team);
  } catch {
    return actionInternalError();
  }
}

export async function listTeams(): Promise<ActionResult<TeamWithMemberCount[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  try {
    const teams = await getUserTeams(userId);
    return actionSuccess(teams);
  } catch {
    return actionInternalError();
  }
}

export async function getTeam(
  teamId: unknown
): Promise<ActionResult<Awaited<ReturnType<typeof getTeamWithMembers>>>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  if (typeof teamId !== "string") {
    return actionValidationError("Invalid team ID");
  }

  try {
    const { allowed } = await assertTeamMembership(teamId, userId);
    if (!allowed) return actionNotFound("Team");

    const team = await getTeamWithMembers(teamId);
    if (!team) return actionNotFound("Team");

    return actionSuccess(team);
  } catch {
    return actionInternalError();
  }
}

export async function updateTeam(
  teamId: unknown,
  rawInput: unknown
): Promise<ActionResult<{ id: string; name: string }>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  if (typeof teamId !== "string") {
    return actionValidationError("Invalid team ID");
  }

  const parsed = UpdateTeamSchema.safeParse(rawInput);
  if (!parsed.success) {
    return actionValidationError("Invalid input");
  }

  try {
    const { allowed, role } = await assertTeamMembership(teamId, userId);
    if (!allowed) return actionNotFound("Team");
    if (role !== TeamRole.OWNER) return actionForbidden();

    const team = await prisma.team.update({
      where: { id: teamId },
      data: parsed.data,
      select: { id: true, name: true },
    });

    return actionSuccess(team);
  } catch {
    return actionInternalError();
  }
}

export async function deleteTeam(
  teamId: unknown
): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  if (typeof teamId !== "string") {
    return actionValidationError("Invalid team ID");
  }

  try {
    const { allowed, role } = await assertTeamMembership(teamId, userId);
    if (!allowed) return actionNotFound("Team");
    if (role !== TeamRole.OWNER) return actionForbidden();

    await prisma.team.delete({ where: { id: teamId } });
    return actionSuccess(undefined);
  } catch {
    return actionInternalError();
  }
}

export async function inviteTeamMember(
  teamId: unknown,
  rawInput: unknown
): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, session } = authResult;

  if (typeof teamId !== "string") {
    return actionValidationError("Invalid team ID");
  }

  const parsed = InviteMemberSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(e.message);
    });
    return actionValidationError("Invalid input", fieldErrors);
  }

  const { email, role } = parsed.data;

  try {
    const { allowed, role: userRole } = await assertTeamMembership(teamId, userId);
    if (!allowed) return actionNotFound("Team");
    if (userRole !== TeamRole.OWNER) return actionForbidden();

    // Check if already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      const existingMembership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: existingUser.id } },
      });
      if (existingMembership) {
        return actionFailure({
          code: "ALREADY_MEMBER",
          message: "This user is already a member of the team",
        });
      }
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    });

    if (!team) return actionNotFound("Team");

    // Invalidate previous invites for this email+team
    await prisma.teamInvitation.updateMany({
      where: { teamId, email, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.teamInvitation.create({
      data: {
        teamId,
        email,
        token,
        role,
        invitedBy: userId,
        expiresAt,
      },
    });

    await sendTeamInvitationEmail(
      email,
      session.user?.name ?? null,
      team.name,
      token
    );

    return actionSuccess(undefined);
  } catch {
    return actionInternalError();
  }
}

export async function acceptTeamInvite(
  rawInput: unknown
): Promise<ActionResult<{ teamId: string }>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, session } = authResult;

  const parsed = AcceptInviteSchema.safeParse(rawInput);
  if (!parsed.success) {
    return actionValidationError("Invalid invite token");
  }

  const { token } = parsed.data;

  try {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: { team: { select: { id: true, name: true } } },
    });

    if (!invitation || invitation.used || invitation.expiresAt < new Date()) {
      return actionFailure({
        code: "INVALID_INVITE",
        message: "This invitation is invalid or has expired",
      });
    }

    // Check that the logged-in user's email matches
    const userEmail = session.user?.email;
    if (userEmail && userEmail !== invitation.email) {
      return actionFailure({
        code: "EMAIL_MISMATCH",
        message: "This invitation was sent to a different email address",
      });
    }

    // Check if already a member
    const existingMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: invitation.teamId, userId } },
    });

    if (existingMembership) {
      return actionFailure({
        code: "ALREADY_MEMBER",
        message: "You are already a member of this team",
      });
    }

    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId,
          role: invitation.role,
        },
      }),
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { used: true },
      }),
    ]);

    return actionSuccess({ teamId: invitation.teamId });
  } catch {
    return actionInternalError();
  }
}

export async function removeTeamMember(
  teamId: unknown,
  memberUserId: unknown
): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  if (typeof teamId !== "string" || typeof memberUserId !== "string") {
    return actionValidationError("Invalid IDs");
  }

  try {
    const { allowed, role } = await assertTeamMembership(teamId, userId);
    if (!allowed) return actionNotFound("Team");

    // Can remove self OR owner can remove others
    if (memberUserId !== userId && role !== TeamRole.OWNER) {
      return actionForbidden();
    }

    // Cannot remove the team owner
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true },
    });

    if (team?.ownerId === memberUserId) {
      return actionFailure({
        code: "CANNOT_REMOVE_OWNER",
        message: "Cannot remove the team owner",
      });
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: memberUserId } },
    });

    return actionSuccess(undefined);
  } catch {
    return actionInternalError();
  }
}

export async function updateMemberRole(
  teamId: unknown,
  rawInput: unknown
): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  if (typeof teamId !== "string") {
    return actionValidationError("Invalid team ID");
  }

  const parsed = UpdateMemberRoleSchema.safeParse(rawInput);
  if (!parsed.success) {
    return actionValidationError("Invalid input");
  }

  const { memberId, role } = parsed.data;

  try {
    const { allowed, role: callerRole } = await assertTeamMembership(teamId, userId);
    if (!allowed) return actionNotFound("Team");
    if (callerRole !== TeamRole.OWNER) return actionForbidden();

    await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
    });

    return actionSuccess(undefined);
  } catch {
    return actionInternalError();
  }
}
