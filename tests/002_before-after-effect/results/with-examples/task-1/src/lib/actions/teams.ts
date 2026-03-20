"use server";

import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  requireTeamOwnership,
  requireTeamMembership,
} from "@/lib/actions/auth-helpers";
import { sendTeamInvitationEmail } from "@/lib/email";
import {
  ActionResult,
  createActionSuccess,
  createActionError,
} from "@/types";
import type { Team, TeamMember } from "@prisma/client";
import { revalidatePath } from "next/cache";

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const inviteSchema = z.object({
  email: z.string().email().max(255),
  teamId: z.string().min(1),
});

export async function getUserTeams(): Promise<
  ActionResult<(Team & { members: TeamMember[] })[]>
> {
  const authResult = await requireAuth();
  if (!authResult.success) return createActionError(authResult.error);

  // Filter by userId in WHERE clause — only return teams the user owns or is a member of
  const ownedTeams = await prisma.team.findMany({
    where: { ownerId: authResult.user.id },
    include: { members: true },
    orderBy: { createdAt: "desc" },
  });

  const memberTeams = await prisma.team.findMany({
    where: {
      members: { some: { userId: authResult.user.id } },
      ownerId: { not: authResult.user.id },
    },
    include: { members: true },
    orderBy: { createdAt: "desc" },
  });

  return createActionSuccess([...ownedTeams, ...memberTeams]);
}

export async function getTeam(
  teamId: string,
): Promise<
  ActionResult<Team & { members: (TeamMember & { user: { id: string; name: string; email: string } })[] }>
> {
  // IDOR prevention: verify membership before returning team data
  const membershipResult = await requireTeamMembership(teamId);
  if (!membershipResult.success) return createActionError(membershipResult.error);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!team) return createActionError("Team not found");

  return createActionSuccess(team);
}

export async function createTeam(formData: FormData): Promise<ActionResult<Team>> {
  const authResult = await requireAuth();
  if (!authResult.success) return createActionError(authResult.error);

  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return createActionError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      ownerId: authResult.user.id,
    },
  });

  revalidatePath("/teams");
  return createActionSuccess(team);
}

export async function deleteTeam(teamId: string): Promise<ActionResult> {
  // IDOR prevention: only the owner can delete a team
  const ownershipResult = await requireTeamOwnership(teamId);
  if (!ownershipResult.success) return createActionError(ownershipResult.error);

  await prisma.team.delete({ where: { id: teamId } });

  revalidatePath("/teams");
  return createActionSuccess();
}

export async function inviteTeamMember(
  formData: FormData,
): Promise<ActionResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return createActionError(authResult.error);

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    teamId: formData.get("teamId"),
  });

  if (!parsed.success) {
    return createActionError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const { email, teamId } = parsed.data;

  // IDOR prevention: verify ownership before inviting
  const ownershipResult = await requireTeamOwnership(teamId);
  if (!ownershipResult.success) return createActionError(ownershipResult.error);

  const team = ownershipResult.team;

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const isMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: existingUser.id } },
    });
    if (isMember || team.ownerId === existingUser.id) {
      return createActionError("This user is already a member of the team");
    }
  }

  // Invalidate existing pending invitations for the same email/team
  await prisma.teamInvitation.updateMany({
    where: { email, teamId, used: false },
    data: { used: true },
  });

  // Generate cryptographically secure token (256-bit)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.teamInvitation.create({
    data: {
      email,
      teamId,
      token,
      expiresAt,
      invitedById: authResult.user.id,
    },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL}/invitations/${token}`;
  // Send asynchronously — do not block the response
  sendTeamInvitationEmail(
    email,
    team.name,
    authResult.user.name,
    inviteUrl,
  ).catch((err) =>
    console.error("Failed to send invitation email:", err),
  );

  revalidatePath(`/teams/${teamId}`);
  return createActionSuccess();
}

export async function acceptInvitation(token: string): Promise<ActionResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return createActionError(authResult.error);

  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
  });

  if (!invitation || invitation.used || invitation.expiresAt < new Date()) {
    return createActionError("Invalid or expired invitation");
  }

  // Verify the invitation is for the authenticated user's email
  if (invitation.email !== authResult.user.email) {
    return createActionError("This invitation was sent to a different email address");
  }

  // Check if already a member
  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: invitation.teamId, userId: authResult.user.id } },
  });
  if (existing) {
    return createActionError("You are already a member of this team");
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: authResult.user.id,
        role: "member",
      },
    }),
    prisma.teamInvitation.update({
      where: { token },
      data: { used: true },
    }),
  ]);

  revalidatePath("/teams");
  return createActionSuccess();
}

export async function removeTeamMember(
  teamId: string,
  userId: string,
): Promise<ActionResult> {
  // IDOR prevention: only the team owner can remove members
  const ownershipResult = await requireTeamOwnership(teamId);
  if (!ownershipResult.success) return createActionError(ownershipResult.error);

  // Cannot remove the owner
  if (userId === ownershipResult.team.ownerId) {
    return createActionError("Cannot remove the team owner");
  }

  await prisma.teamMember.deleteMany({
    where: { teamId, userId },
  });

  revalidatePath(`/teams/${teamId}`);
  return createActionSuccess();
}
