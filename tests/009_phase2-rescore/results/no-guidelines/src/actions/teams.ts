"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "@/lib/validations/team";
import { actionSuccess, actionError } from "@/lib/api-response";
import { TeamRole } from "@prisma/client";
import { sendTeamInvitationEmail } from "@/lib/email";

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

async function requireTeamRole(teamId: string, userId: string, minRole: TeamRole) {
  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!member) return null;
  const hierarchy = [TeamRole.VIEWER, TeamRole.MEMBER, TeamRole.OWNER];
  if (hierarchy.indexOf(member.role) < hierarchy.indexOf(minRole)) return null;
  return member;
}

export async function createTeamAction(formData: FormData) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  };

  const parsed = createTeamSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const team = await db.team.create({
    data: {
      ...parsed.data,
      members: {
        create: { userId: session.user.id, role: TeamRole.OWNER },
      },
    },
  });

  revalidatePath("/teams");

  return actionSuccess(team);
}

export async function updateTeamAction(teamId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const member = await requireTeamRole(teamId, session.user.id, TeamRole.OWNER);
  if (!member) return actionError("Insufficient permissions");

  const raw = {
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
  };

  const parsed = updateTeamSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const updated = await db.team.update({ where: { id: teamId }, data: parsed.data });

  revalidatePath(`/teams/${teamId}`);

  return actionSuccess(updated);
}

export async function deleteTeamAction(teamId: string) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const member = await requireTeamRole(teamId, session.user.id, TeamRole.OWNER);
  if (!member) return actionError("Insufficient permissions");

  await db.team.delete({ where: { id: teamId } });

  revalidatePath("/teams");

  return actionSuccess(undefined);
}

export async function inviteMemberAction(teamId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const member = await requireTeamRole(teamId, session.user.id, TeamRole.OWNER);
  if (!member) return actionError("Insufficient permissions");

  const raw = {
    email: formData.get("email"),
    role: formData.get("role") || TeamRole.MEMBER,
  };

  const parsed = inviteMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team) return actionError("Team not found");

  // Invalidate previous invitations for same email/team
  await db.teamInvitation.updateMany({
    where: { teamId, email: parsed.data.email, acceptedAt: null },
    data: { expiresAt: new Date(0) },
  });

  const invitation = await db.teamInvitation.create({
    data: {
      teamId,
      email: parsed.data.email,
      role: parsed.data.role,
      invitedById: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  const inviter = await db.user.findUnique({ where: { id: session.user.id } });

  await sendTeamInvitationEmail(
    parsed.data.email,
    team.name,
    inviter?.name ?? "A team member",
    invitation.token,
  );

  revalidatePath(`/teams/${teamId}`);

  return actionSuccess(invitation);
}

export async function acceptInvitationAction(token: string) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const invitation = await db.teamInvitation.findUnique({ where: { token } });

  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return actionError("This invitation is invalid or has expired.");
  }

  const existingMember = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId: invitation.teamId, userId: session.user.id } },
  });

  if (existingMember) {
    await db.teamInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
    return actionSuccess({ teamId: invitation.teamId });
  }

  await db.$transaction([
    db.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: session.user.id,
        role: invitation.role,
      },
    }),
    db.teamInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  revalidatePath(`/teams/${invitation.teamId}`);

  return actionSuccess({ teamId: invitation.teamId });
}

export async function removeMemberAction(teamId: string, userId: string) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const member = await requireTeamRole(teamId, session.user.id, TeamRole.OWNER);
  if (!member) return actionError("Insufficient permissions");

  // Prevent removing self (owner)
  if (userId === session.user.id) return actionError("Cannot remove yourself as owner");

  await db.teamMember.delete({
    where: { teamId_userId: { teamId, userId } },
  });

  revalidatePath(`/teams/${teamId}`);

  return actionSuccess(undefined);
}

export async function updateMemberRoleAction(teamId: string, userId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const member = await requireTeamRole(teamId, session.user.id, TeamRole.OWNER);
  if (!member) return actionError("Insufficient permissions");

  const raw = { role: formData.get("role") };
  const parsed = updateMemberRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  await db.teamMember.update({
    where: { teamId_userId: { teamId, userId } },
    data: { role: parsed.data.role },
  });

  revalidatePath(`/teams/${teamId}`);

  return actionSuccess(undefined);
}
