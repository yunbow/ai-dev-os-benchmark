"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma/client";
import {
  actionSuccess,
  actionFailure,
  withAction,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import { requireAuth } from "@/lib/actions/auth-helpers";
import {
  TeamSchema,
  InviteSchema,
  UpdateMemberRoleSchema,
  type TeamInput,
  type InviteInput,
  type UpdateMemberRoleInput,
} from "../schema/team-schema";
import { sendTeamInvitationEmail } from "@/lib/email";
import type { Team, TeamMember, User, TeamRole } from "@prisma/client";

export type TeamMemberWithUser = TeamMember & {
  user: Pick<User, "id" | "name" | "email">;
};

export type TeamWithMembers = Team & {
  members: TeamMemberWithUser[];
  _count: { tasks: number };
};

async function requireTeamRole(
  teamId: string,
  userId: string,
  minRole: "OWNER" | "MEMBER" | "VIEWER"
): Promise<{ allowed: true; role: TeamRole } | { allowed: false; error: ReturnType<typeof actionFailure> }> {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });

  if (!membership) {
    return {
      allowed: false,
      error: actionFailure("FORBIDDEN", "You are not a member of this team."),
    };
  }

  const roleOrder: Record<string, number> = { VIEWER: 0, MEMBER: 1, OWNER: 2 };

  if (roleOrder[membership.role] < roleOrder[minRole]) {
    return {
      allowed: false,
      error: actionFailure("FORBIDDEN", "You do not have permission to perform this action."),
    };
  }

  return { allowed: true, role: membership.role };
}

export async function createTeam(data: TeamInput): Promise<ActionResult<Team>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const parsed = TeamSchema.safeParse(data);
    if (!parsed.success) {
      return actionFailure("VALIDATION_ERROR", "Invalid team data.", {
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      });
    }

    const userId = authResult.session.user.id;

    const team = await prisma.team.create({
      data: {
        name: parsed.data.name,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
    });

    return actionSuccess(team);
  });
}

export async function inviteMember(
  teamId: string,
  data: InviteInput
): Promise<ActionResult<{ message: string }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const parsed = InviteSchema.safeParse(data);
    if (!parsed.success) {
      return actionFailure("VALIDATION_ERROR", "Invalid invitation data.", {
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      });
    }

    const userId = authResult.session.user.id;
    const { email, role } = parsed.data;

    const roleCheck = await requireTeamRole(teamId, userId, "OWNER");
    if (!roleCheck.allowed) return roleCheck.error;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    });

    if (!team) {
      return actionFailure("NOT_FOUND", "Team not found.");
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      const existingMembership = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: existingUser.id, teamId } },
      });
      if (existingMembership) {
        return actionFailure("ALREADY_MEMBER", "This user is already a member of the team.");
      }
    }

    // Delete any existing pending invitations for this email/team
    await prisma.teamInvitation.deleteMany({
      where: { email, teamId, usedAt: null },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.teamInvitation.create({
      data: {
        email,
        teamId,
        token,
        role,
        expiresAt,
        invitedById: userId,
      },
    });

    const inviter = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const inviterName = inviter?.name ?? inviter?.email ?? "Someone";

    try {
      await sendTeamInvitationEmail(email, team.name, inviterName, token);
    } catch (error) {
      console.error("[Team Invitation Email Error]", error);
    }

    return actionSuccess({ message: `Invitation sent to ${email}.` });
  });
}

export async function acceptInvitation(
  token: string
): Promise<ActionResult<{ teamId: string; teamName: string }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const userId = authResult.session.user.id;
    const userEmail = authResult.session.user.email;

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: { team: { select: { id: true, name: true } } },
    });

    if (!invitation) {
      return actionFailure("INVALID_TOKEN", "This invitation link is invalid.");
    }

    if (invitation.usedAt) {
      return actionFailure("TOKEN_USED", "This invitation has already been used.");
    }

    if (invitation.expiresAt < new Date()) {
      return actionFailure("TOKEN_EXPIRED", "This invitation has expired.");
    }

    // Verify the invitation email matches the logged-in user
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      return actionFailure(
        "EMAIL_MISMATCH",
        "This invitation was sent to a different email address."
      );
    }

    // Check if already a member
    const existingMembership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: invitation.teamId } },
    });

    if (existingMembership) {
      return actionFailure("ALREADY_MEMBER", "You are already a member of this team.");
    }

    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          userId,
          teamId: invitation.teamId,
          role: invitation.role,
        },
      }),
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return actionSuccess({
      teamId: invitation.teamId,
      teamName: invitation.team.name,
    });
  });
}

export async function removeMember(
  teamId: string,
  targetUserId: string
): Promise<ActionResult<{ userId: string }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const userId = authResult.session.user.id;

    // Can remove yourself OR if you're an owner
    if (userId !== targetUserId) {
      const roleCheck = await requireTeamRole(teamId, userId, "OWNER");
      if (!roleCheck.allowed) return roleCheck.error;
    }

    // Cannot remove the last owner
    const targetMembership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: targetUserId, teamId } },
      select: { role: true },
    });

    if (!targetMembership) {
      return actionFailure("NOT_FOUND", "Member not found in this team.");
    }

    if (targetMembership.role === "OWNER") {
      const ownerCount = await prisma.teamMember.count({
        where: { teamId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return actionFailure(
          "LAST_OWNER",
          "Cannot remove the last owner. Transfer ownership first."
        );
      }
    }

    await prisma.teamMember.delete({
      where: { userId_teamId: { userId: targetUserId, teamId } },
    });

    return actionSuccess({ userId: targetUserId });
  });
}

export async function updateMemberRole(
  teamId: string,
  targetUserId: string,
  data: UpdateMemberRoleInput
): Promise<ActionResult<TeamMemberWithUser>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const parsed = UpdateMemberRoleSchema.safeParse(data);
    if (!parsed.success) {
      return actionFailure("VALIDATION_ERROR", "Invalid role.", {
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      });
    }

    const userId = authResult.session.user.id;

    const roleCheck = await requireTeamRole(teamId, userId, "OWNER");
    if (!roleCheck.allowed) return roleCheck.error;

    const targetMembership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: targetUserId, teamId } },
    });

    if (!targetMembership) {
      return actionFailure("NOT_FOUND", "Member not found in this team.");
    }

    // Cannot demote the last owner
    if (targetMembership.role === "OWNER" && parsed.data.role !== "OWNER") {
      const ownerCount = await prisma.teamMember.count({
        where: { teamId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return actionFailure(
          "LAST_OWNER",
          "Cannot demote the last owner. Assign another owner first."
        );
      }
    }

    const updated = await prisma.teamMember.update({
      where: { userId_teamId: { userId: targetUserId, teamId } },
      data: { role: parsed.data.role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return actionSuccess(updated as TeamMemberWithUser);
  });
}

export async function getTeamMembers(
  teamId: string
): Promise<ActionResult<TeamMemberWithUser[]>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const userId = authResult.session.user.id;

    const roleCheck = await requireTeamRole(teamId, userId, "VIEWER");
    if (!roleCheck.allowed) return roleCheck.error;

    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    return actionSuccess(members as TeamMemberWithUser[]);
  });
}

export async function getTeams(): Promise<ActionResult<TeamWithMembers[]>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const userId = authResult.session.user.id;

    const teams = await prisma.team.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return actionSuccess(teams as TeamWithMembers[]);
  });
}

export async function getTeam(id: string): Promise<ActionResult<TeamWithMembers>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const userId = authResult.session.user.id;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!team) {
      return actionFailure("NOT_FOUND", "Team not found.");
    }

    const isMember = team.members.some((m) => m.userId === userId);
    if (!isMember) {
      return actionFailure("FORBIDDEN", "You are not a member of this team.");
    }

    return actionSuccess(team as TeamWithMembers);
  });
}
