"use server";

import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendTeamInvitationEmail } from "@/lib/email";
import {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "@/lib/validations/team";
import type { ActionResult } from "@/types";
import { Team, TeamMember, TeamRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

async function assertTeamRole(
  teamId: string,
  userId: string,
  requiredRoles: TeamRole[]
): Promise<TeamMember> {
  const member = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (!member || !requiredRoles.includes(member.role)) {
    throw new Error("Forbidden: insufficient permissions");
  }
  return member;
}

export async function createTeam(formData: FormData): Promise<ActionResult<Team>> {
  const userId = await getAuthenticatedUserId();

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  };

  const parsed = createTeamSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const team = await db.$transaction(async (tx) => {
      const t = await tx.team.create({
        data: { ...parsed.data, creatorId: userId },
      });
      await tx.teamMember.create({
        data: { teamId: t.id, userId, role: TeamRole.OWNER },
      });
      return t;
    });

    revalidatePath("/teams");
    return { success: true, data: team };
  } catch (err) {
    console.error("createTeam DB error:", err);
    return { success: false, error: "Failed to create team. Please try again." };
  }
}

export async function updateTeam(
  teamId: string,
  formData: FormData
): Promise<ActionResult<Team>> {
  const userId = await getAuthenticatedUserId();

  try {
    await assertTeamRole(teamId, userId, [TeamRole.OWNER]);
  } catch {
    return { success: false, error: "Forbidden: insufficient permissions" };
  }

  const raw = {
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
  };

  const parsed = updateTeamSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const team = await db.team.update({ where: { id: teamId }, data: parsed.data });
    revalidatePath(`/teams/${teamId}`);
    return { success: true, data: team };
  } catch (err) {
    console.error("updateTeam DB error:", err);
    return { success: false, error: "Failed to update team. Please try again." };
  }
}

export async function deleteTeam(teamId: string): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();

  try {
    await assertTeamRole(teamId, userId, [TeamRole.OWNER]);
    await db.team.delete({ where: { id: teamId } });
    revalidatePath("/teams");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("deleteTeam DB error:", err);
    return { success: false, error: "Failed to delete team. Please try again." };
  }
}

export async function inviteTeamMember(
  teamId: string,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();

  try {
    await assertTeamRole(teamId, userId, [TeamRole.OWNER, TeamRole.MEMBER]);
  } catch {
    return { success: false, error: "Forbidden: insufficient permissions" };
  }

  const raw = {
    email: formData.get("email"),
    role: formData.get("role") || undefined,
  };

  const parsed = inviteMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team) return { success: false, error: "Team not found" };

    const inviter = await db.user.findUnique({ where: { id: userId }, select: { name: true } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.teamInvitation.create({
      data: {
        teamId,
        email: parsed.data.email,
        role: parsed.data.role,
        token,
        expiresAt,
      },
    });

    await sendTeamInvitationEmail(
      parsed.data.email,
      team.name,
      inviter?.name ?? "A teammate",
      token
    );

    revalidatePath(`/teams/${teamId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("inviteTeamMember error:", err);
    return { success: false, error: "Failed to send invitation. Please try again." };
  }
}

export async function acceptTeamInvitation(token: string): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();

  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) return { success: false, error: "User not found" };

    const invitation = await db.teamInvitation.findUnique({ where: { token } });
    if (!invitation || invitation.used || invitation.expiresAt < new Date()) {
      return { success: false, error: "Invalid or expired invitation" };
    }

    await db.$transaction([
      db.teamMember.upsert({
        where: { userId_teamId: { userId, teamId: invitation.teamId } },
        create: { userId, teamId: invitation.teamId, role: invitation.role },
        update: { role: invitation.role },
      }),
      db.teamInvitation.update({ where: { id: invitation.id }, data: { used: true } }),
    ]);

    revalidatePath("/teams");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("acceptTeamInvitation DB error:", err);
    return { success: false, error: "Failed to accept invitation. Please try again." };
  }
}

export async function removeTeamMember(
  teamId: string,
  memberId: string
): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();

  try {
    await assertTeamRole(teamId, userId, [TeamRole.OWNER]);
  } catch {
    return { success: false, error: "Forbidden: insufficient permissions" };
  }

  try {
    const memberToRemove = await db.teamMember.findUnique({
      where: { userId_teamId: { userId: memberId, teamId } },
    });
    if (!memberToRemove) return { success: false, error: "Member not found" };
    if (memberToRemove.role === TeamRole.OWNER) {
      return { success: false, error: "Cannot remove the team owner" };
    }

    await db.teamMember.delete({
      where: { userId_teamId: { userId: memberId, teamId } },
    });

    revalidatePath(`/teams/${teamId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("removeTeamMember DB error:", err);
    return { success: false, error: "Failed to remove member. Please try again." };
  }
}

export async function updateMemberRole(
  teamId: string,
  memberId: string,
  formData: FormData
): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();

  try {
    await assertTeamRole(teamId, userId, [TeamRole.OWNER]);
  } catch {
    return { success: false, error: "Forbidden: insufficient permissions" };
  }

  const raw = { role: formData.get("role") };
  const parsed = updateMemberRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid role" };
  }

  try {
    await db.teamMember.update({
      where: { userId_teamId: { userId: memberId, teamId } },
      data: { role: parsed.data.role },
    });

    revalidatePath(`/teams/${teamId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("updateMemberRole DB error:", err);
    return { success: false, error: "Failed to update role. Please try again." };
  }
}
