"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "@/lib/validations/team";
import type { ActionResult, TeamWithMembers } from "@/types";
import type {
  CreateTeamInput,
  UpdateTeamInput,
  InviteMemberInput,
  UpdateMemberRoleInput,
} from "@/lib/validations/team";
import { TeamRole } from "@prisma/client";
import { generateToken } from "@/lib/utils";
import { sendEmail, getTeamInvitationEmailHtml } from "@/lib/email";
import { revalidatePath } from "next/cache";

const teamSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
  _count: { select: { members: true, tasks: true } },
} as const;

export async function createTeamAction(
  data: CreateTeamInput
): Promise<ActionResult<TeamWithMembers>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = createTeamSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: TeamRole.OWNER,
        },
      },
    },
    select: teamSelect,
  });

  revalidatePath("/teams");
  return { success: true, data: team as unknown as TeamWithMembers };
}

export async function updateTeamAction(
  id: string,
  data: UpdateTeamInput
): Promise<ActionResult<TeamWithMembers>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = updateTeamSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const team = await prisma.team.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!team) {
    return { success: false, error: "Team not found" };
  }

  if (team.ownerId !== session.user.id) {
    return { success: false, error: "Only the team owner can update team settings" };
  }

  const updated = await prisma.team.update({
    where: { id },
    data: parsed.data,
    select: teamSelect,
  });

  revalidatePath("/teams");
  revalidatePath(`/teams/${id}`);
  return { success: true, data: updated as unknown as TeamWithMembers };
}

export async function deleteTeamAction(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const team = await prisma.team.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!team) {
    return { success: false, error: "Team not found" };
  }

  if (team.ownerId !== session.user.id) {
    return { success: false, error: "Only the team owner can delete this team" };
  }

  await prisma.team.delete({ where: { id } });

  revalidatePath("/teams");
  return { success: true, data: undefined };
}

export async function inviteMemberAction(
  teamId: string,
  data: InviteMemberInput
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = inviteMemberSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true, name: true },
  });

  if (!team) {
    return { success: false, error: "Team not found" };
  }

  if (team.ownerId !== session.user.id) {
    return { success: false, error: "Only the team owner can invite members" };
  }

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true },
  });

  if (existingUser) {
    const existingMember = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: existingUser.id, teamId } },
    });
    if (existingMember) {
      return { success: false, error: "This user is already a team member" };
    }
  }

  // Invalidate existing pending invitations for this email+team
  await prisma.teamInvitation.updateMany({
    where: { teamId, email: parsed.data.email.toLowerCase(), used: false },
    data: { used: true },
  });

  const token = generateToken(48);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.teamInvitation.create({
    data: {
      teamId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      token,
      expiresAt,
      invitedById: session.user.id,
    },
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/teams/accept-invite?token=${token}`;

  try {
    await sendEmail({
      to: parsed.data.email,
      subject: `You're invited to join ${team.name} on TaskFlow`,
      html: getTeamInvitationEmailHtml(inviteUrl, team.name, session.user.name ?? session.user.email ?? "A user"),
    });
  } catch (emailError) {
    console.error("Failed to send invitation email:", emailError);
  }

  revalidatePath(`/teams/${teamId}`);
  return { success: true, data: undefined };
}

export async function removeMemberAction(
  teamId: string,
  memberId: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true },
  });

  if (!team) {
    return { success: false, error: "Team not found" };
  }

  // Owner can remove anyone, members can remove themselves
  const canRemove =
    team.ownerId === session.user.id || memberId === session.user.id;

  if (!canRemove) {
    return { success: false, error: "You don't have permission to remove this member" };
  }

  if (memberId === team.ownerId) {
    return { success: false, error: "The team owner cannot be removed" };
  }

  await prisma.teamMember.delete({
    where: { userId_teamId: { userId: memberId, teamId } },
  });

  revalidatePath(`/teams/${teamId}`);
  return { success: true, data: undefined };
}

export async function updateMemberRoleAction(
  teamId: string,
  memberId: string,
  data: UpdateMemberRoleInput
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = updateMemberRoleSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true },
  });

  if (!team) {
    return { success: false, error: "Team not found" };
  }

  if (team.ownerId !== session.user.id) {
    return { success: false, error: "Only the team owner can change member roles" };
  }

  if (parsed.data.role === TeamRole.OWNER) {
    return { success: false, error: "Cannot assign Owner role through this action" };
  }

  await prisma.teamMember.update({
    where: { userId_teamId: { userId: memberId, teamId } },
    data: { role: parsed.data.role },
  });

  revalidatePath(`/teams/${teamId}`);
  return { success: true, data: undefined };
}

export async function acceptInviteAction(token: string): Promise<ActionResult<{ teamId: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    select: { id: true, teamId: true, email: true, role: true, expiresAt: true, used: true },
  });

  if (!invitation) {
    return { success: false, error: "Invalid invitation link" };
  }

  if (invitation.used) {
    return { success: false, error: "This invitation has already been used" };
  }

  if (invitation.expiresAt < new Date()) {
    return { success: false, error: "This invitation has expired" };
  }

  // Check if already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.user.id, teamId: invitation.teamId } },
  });

  if (existingMember) {
    await prisma.teamInvitation.update({ where: { id: invitation.id }, data: { used: true } });
    return { success: true, data: { teamId: invitation.teamId } };
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        userId: session.user.id,
        teamId: invitation.teamId,
        role: invitation.role,
      },
    }),
    prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { used: true },
    }),
  ]);

  revalidatePath("/teams");
  return { success: true, data: { teamId: invitation.teamId } };
}
