"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/utils";
import { sendTeamInvitationEmail } from "@/lib/email";
import {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "@/validations/team";
import type { ActionResult, TeamWithMembers } from "@/types";
import { revalidatePath } from "next/cache";

export async function createTeam(formData: FormData): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  const parsed = createTeamSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  const team = await prisma.$transaction(async (tx) => {
    const created = await tx.team.create({
      data: { name: parsed.data.name, ownerId: session.user.id },
    });
    await tx.teamMember.create({
      data: { userId: session.user.id, teamId: created.id, role: "OWNER" },
    });
    return created;
  });

  revalidatePath("/dashboard/teams");
  return { success: true, data: { id: team.id, name: team.name } };
}

export async function updateTeam(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  await requireTeamRole(session.user.id, id, ["OWNER"]);

  const parsed = updateTeamSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  const team = await prisma.team.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true },
  });

  revalidatePath(`/dashboard/teams/${id}`);
  return { success: true, data: team };
}

export async function deleteTeam(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return { success: false, error: "Team not found" };
  if (team.ownerId !== session.user.id) return { success: false, error: "Only the owner can delete the team" };

  await prisma.team.delete({ where: { id } });
  revalidatePath("/dashboard/teams");
  return { success: true, data: undefined };
}

export async function inviteTeamMember(
  teamId: string,
  formData: FormData
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  await requireTeamRole(session.user.id, teamId, ["OWNER"]);

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  const { email, role } = parsed.data;

  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: existingUser.id, teamId } },
    });
    if (membership) return { success: false, error: "User is already a member of this team" };
  }

  // Revoke existing pending invitation
  await prisma.teamInvitation.updateMany({
    where: { teamId, email, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = generateToken(48);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.teamInvitation.create({
    data: { email, teamId, token, expiresAt, invitedBy: session.user.id },
  });

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } });
  const inviter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite?token=${token}`;
  await sendTeamInvitationEmail(
    email,
    team?.name ?? "a team",
    inviter?.name ?? "Someone",
    inviteUrl
  );

  revalidatePath(`/dashboard/teams/${teamId}`);
  return { success: true, data: undefined };
}

export async function acceptInvitation(token: string): Promise<ActionResult<{ teamId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  const invitation = await prisma.teamInvitation.findUnique({ where: { token } });
  if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
    return { success: false, error: "This invitation is invalid or has expired" };
  }

  if (invitation.email !== session.user.email) {
    return { success: false, error: "This invitation was sent to a different email address" };
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: { userId: session.user.id, teamId: invitation.teamId, role: "MEMBER" },
    }),
    prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    }),
  ]);

  revalidatePath("/dashboard/teams");
  return { success: true, data: { teamId: invitation.teamId } };
}

export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  // Only owner can remove others; members can remove themselves
  if (userId !== session.user.id) {
    await requireTeamRole(session.user.id, teamId, ["OWNER"]);
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (team?.ownerId === userId) {
    return { success: false, error: "Team owner cannot be removed. Transfer ownership first." };
  }

  await prisma.teamMember.delete({
    where: { userId_teamId: { userId, teamId } },
  });

  revalidatePath(`/dashboard/teams/${teamId}`);
  return { success: true, data: undefined };
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  formData: FormData
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  await requireTeamRole(session.user.id, teamId, ["OWNER"]);

  const parsed = updateMemberRoleSchema.safeParse({ role: formData.get("role") });
  if (!parsed.success) {
    return { success: false, error: "Invalid role" };
  }

  await prisma.teamMember.update({
    where: { userId_teamId: { userId, teamId } },
    data: { role: parsed.data.role },
  });

  revalidatePath(`/dashboard/teams/${teamId}`);
  return { success: true, data: undefined };
}

async function requireTeamRole(
  userId: string,
  teamId: string,
  roles: string[]
): Promise<void> {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (!membership || !roles.includes(membership.role)) {
    throw new Error("Insufficient permissions");
  }
}
