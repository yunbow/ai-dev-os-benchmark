"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withAction, actionSuccess, ActionErrors, actionError } from "@/lib/action-helpers";
import { requireTeamRole } from "@/lib/permissions";
import { sendTeamInvitationEmail } from "@/lib/email";
import {
  TeamCreateSchema,
  TeamUpdateSchema,
  InviteMemberSchema,
  UpdateMemberRoleSchema,
  AcceptInvitationSchema,
} from "./schemas";
import type {
  TeamCreateInput,
  TeamUpdateInput,
  InviteMemberInput,
  UpdateMemberRoleInput,
  AcceptInvitationInput,
} from "./schemas";
import type { ActionResult } from "@/lib/action-helpers";
import type { Team, TeamMember, TeamInvitation } from "@prisma/client";
import { randomUUID } from "crypto";

export type TeamWithMembers = Team & {
  members: (TeamMember & { user: { id: string; name: string | null; email: string; image: string | null } })[];
  _count: { tasks: number };
};

export async function createTeam(input: TeamCreateInput): Promise<ActionResult<Team>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const validated = TeamCreateSchema.parse(input);

    const userId = session.user.id;

    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: validated.name,
          description: validated.description,
          ownerId: userId,
        },
      });

      // Creator becomes OWNER member
      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId,
          role: "OWNER",
        },
      });

      return newTeam;
    });

    return actionSuccess(team);
  });
}

export async function updateTeam(
  teamId: string,
  input: TeamUpdateInput
): Promise<ActionResult<Team>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const validated = TeamUpdateSchema.parse(input);

    // Only owners can update team info
    const membership = await requireTeamRole(teamId, session.user.id, "OWNER");
    if (!("member" in membership)) return membership;

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(validated.name ? { name: validated.name } : {}),
        ...(validated.description !== undefined ? { description: validated.description } : {}),
      },
    });

    return actionSuccess(team);
  });
}

export async function deleteTeam(teamId: string): Promise<ActionResult<void>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const membership = await requireTeamRole(teamId, session.user.id, "OWNER");
    if (!("member" in membership)) return membership;

    await prisma.team.delete({ where: { id: teamId } });

    return actionSuccess(undefined);
  });
}

export async function getTeam(teamId: string): Promise<ActionResult<TeamWithMembers>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const membership = await requireTeamRole(teamId, session.user.id, "VIEWER");
    if (!("member" in membership)) return membership;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!team) return ActionErrors.notFound("Team");

    return actionSuccess(team as TeamWithMembers);
  });
}

export async function listUserTeams(): Promise<ActionResult<Team[]>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const memberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      include: { team: true },
      orderBy: { joinedAt: "desc" },
      take: 100,
    });

    return actionSuccess(memberships.map((m) => m.team));
  });
}

export async function inviteMember(input: InviteMemberInput): Promise<ActionResult<TeamInvitation>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const validated = InviteMemberSchema.parse(input);

    // Only owners can invite
    const membership = await requireTeamRole(validated.teamId, session.user.id, "OWNER");
    if (!("member" in membership)) return membership;

    const team = await prisma.team.findUnique({ where: { id: validated.teamId } });
    if (!team) return ActionErrors.notFound("Team");

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existingUser) {
      const existingMembership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: validated.teamId, userId: existingUser.id } },
      });
      if (existingMembership) {
        return actionError("TEAM_ALREADY_MEMBER", "This user is already a team member");
      }
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.teamInvitation.findFirst({
      where: {
        teamId: validated.teamId,
        email: validated.email,
        status: "PENDING",
      },
    });

    if (existingInvite) {
      return actionError("TEAM_INVITE_EXISTS", "An invitation has already been sent to this email");
    }

    const token = randomUUID();

    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId: validated.teamId,
        email: validated.email,
        role: validated.role,
        token,
        senderId: session.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const sender = await prisma.user.findUnique({ where: { id: session.user.id } });

    await sendTeamInvitationEmail({
      to: validated.email,
      teamName: team.name,
      inviterName: sender?.name ?? sender?.email ?? "A team member",
      inviteToken: token,
      appUrl,
    });

    return actionSuccess(invitation);
  });
}

export async function acceptInvitation(
  input: AcceptInvitationInput
): Promise<ActionResult<TeamMember>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const validated = AcceptInvitationSchema.parse(input);

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token: validated.token },
    });

    if (!invitation) {
      return actionError("TEAM_INVITE_NOT_FOUND", "Invitation not found");
    }

    if (invitation.status !== "PENDING") {
      return actionError("TEAM_INVITE_ALREADY_ACCEPTED", "This invitation has already been used");
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return actionError("TEAM_INVITE_EXPIRED", "This invitation has expired");
    }

    // Verify the invitation was sent to the current user's email
    const session2 = await auth();
    if (!session2?.user?.email || session2.user.email !== invitation.email) {
      return actionError(
        "TEAM_INVITE_EMAIL_MISMATCH",
        "This invitation was sent to a different email address"
      );
    }

    const acceptingUserId = session.user.id;

    const member = await prisma.$transaction(async (tx) => {
      const newMember = await tx.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: acceptingUserId,
          role: invitation.role,
        },
      });

      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });

      return newMember;
    });

    return actionSuccess(member);
  });
}

export async function removeMember(
  teamId: string,
  userId: string
): Promise<ActionResult<void>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    // Only owners can remove members (or users can remove themselves)
    if (userId !== session.user.id) {
      const membership = await requireTeamRole(teamId, session.user.id, "OWNER");
      if (!("member" in membership)) return membership;
    }

    // Can't remove the owner
    const targetMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!targetMember) return ActionErrors.notFound("Team member");

    if (targetMember.role === "OWNER") {
      return actionError("TEAM_CANNOT_REMOVE_OWNER", "Cannot remove the team owner");
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });

    return actionSuccess(undefined);
  });
}

export async function updateMemberRole(
  input: UpdateMemberRoleInput
): Promise<ActionResult<TeamMember>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const validated = UpdateMemberRoleSchema.parse(input);

    // Only owners can change roles
    const membership = await requireTeamRole(validated.teamId, session.user.id, "OWNER");
    if (!("member" in membership)) return membership;

    // Can't change the owner's role
    const targetMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: validated.teamId, userId: validated.userId } },
    });

    if (!targetMember) return ActionErrors.notFound("Team member");

    if (targetMember.role === "OWNER") {
      return actionError("TEAM_CANNOT_CHANGE_OWNER_ROLE", "Cannot change the owner's role");
    }

    const updated = await prisma.teamMember.update({
      where: { teamId_userId: { teamId: validated.teamId, userId: validated.userId } },
      data: { role: validated.role },
    });

    return actionSuccess(updated);
  });
}
