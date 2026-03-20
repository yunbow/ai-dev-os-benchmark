"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "@/lib/validations/team";
import type { ActionResult } from "@/lib/utils";
import { generateSecureToken } from "@/lib/utils";
import { sendEmail, getTeamInvitationEmailHtml } from "@/lib/email";
import type { Team, TeamMember } from "@prisma/client";

export async function getTeams(): Promise<
  ActionResult<(Team & { _count: { members: number } })[]>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const teams = await db.team.findMany({
      where: {
        members: { some: { userId: session.user.id } },
      },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: teams };
  } catch (error) {
    console.error("getTeams error:", error);
    return { success: false, error: "Failed to fetch teams" };
  }
}

export async function createTeam(rawData: unknown): Promise<ActionResult<Team>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createTeamSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((err) => {
      const key = err.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(err.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  try {
    const team = await db.team.create({
      data: {
        ...parsed.data,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    revalidatePath("/teams");
    return { success: true, data: team, message: "Team created successfully" };
  } catch (error) {
    console.error("createTeam error:", error);
    return { success: false, error: "Failed to create team" };
  }
}

export async function updateTeam(
  teamId: string,
  rawData: unknown
): Promise<ActionResult<Team>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateTeamSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((err) => {
      const key = err.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(err.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  try {
    // RBAC: only OWNER can update team settings
    const membership = await db.teamMember.findFirst({
      where: { teamId, userId: session.user.id, role: "OWNER" },
    });

    if (!membership) {
      return {
        success: false,
        error: "Only team owners can update team settings",
      };
    }

    const team = await db.team.update({
      where: { id: teamId },
      data: parsed.data,
    });

    revalidatePath("/teams");
    return { success: true, data: team, message: "Team updated successfully" };
  } catch (error) {
    console.error("updateTeam error:", error);
    return { success: false, error: "Failed to update team" };
  }
}

export async function deleteTeam(teamId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // RBAC: only OWNER can delete team
    const team = await db.team.findFirst({
      where: { id: teamId, ownerId: session.user.id },
    });

    if (!team) {
      return { success: false, error: "Team not found or access denied" };
    }

    await db.team.delete({ where: { id: teamId } });

    revalidatePath("/teams");
    return { success: true, message: "Team deleted successfully" };
  } catch (error) {
    console.error("deleteTeam error:", error);
    return { success: false, error: "Failed to delete team" };
  }
}

export async function inviteTeamMember(
  teamId: string,
  rawData: unknown
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = inviteMemberSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((err) => {
      const key = err.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(err.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  try {
    // RBAC: only OWNER or MEMBER can invite
    const membership = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: { in: ["OWNER", "MEMBER"] },
      },
      include: { team: { select: { name: true } } },
    });

    if (!membership) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Non-owners can only invite as MEMBER
    if (membership.role !== "OWNER" && parsed.data.role !== "MEMBER") {
      return { success: false, error: "Only owners can invite with this role" };
    }

    // Check if user is already a member
    const existingUser = await db.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existingUser) {
      const existingMember = await db.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: existingUser.id } },
      });
      if (existingMember) {
        return { success: false, error: "User is already a team member" };
      }
    }

    // Invalidate any existing pending invitations for this email/team
    await db.teamInvitation.updateMany({
      where: { teamId, email: parsed.data.email, used: false },
      data: { used: true },
    });

    const token = generateSecureToken();
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

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/accept-invitation?token=${token}`;
    await sendEmail({
      to: parsed.data.email,
      subject: `You've been invited to join ${membership.team.name} on TaskFlow`,
      html: getTeamInvitationEmailHtml(membership.team.name, inviteUrl),
    });

    revalidatePath("/teams");
    return { success: true, message: "Invitation sent successfully" };
  } catch (error) {
    console.error("inviteTeamMember error:", error);
    return { success: false, error: "Failed to send invitation" };
  }
}

export async function updateMemberRole(
  teamId: string,
  memberId: string,
  rawData: unknown
): Promise<ActionResult<TeamMember>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateMemberRoleSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: "Invalid role" };
  }

  try {
    // RBAC: only OWNER can change roles
    const requesterMembership = await db.teamMember.findFirst({
      where: { teamId, userId: session.user.id, role: "OWNER" },
    });

    if (!requesterMembership) {
      return { success: false, error: "Only owners can change member roles" };
    }

    const targetMember = await db.teamMember.findFirst({
      where: { id: memberId, teamId },
    });

    if (!targetMember) {
      return { success: false, error: "Member not found" };
    }

    // Cannot change the role of the owner
    if (targetMember.role === "OWNER") {
      return { success: false, error: "Cannot change the owner's role" };
    }

    const updated = await db.teamMember.update({
      where: { id: memberId },
      data: { role: parsed.data.role },
    });

    revalidatePath("/teams");
    return { success: true, data: updated, message: "Role updated successfully" };
  } catch (error) {
    console.error("updateMemberRole error:", error);
    return { success: false, error: "Failed to update member role" };
  }
}

export async function removeTeamMember(
  teamId: string,
  memberId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const member = await db.teamMember.findFirst({
      where: { id: memberId, teamId },
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // RBAC: OWNER can remove anyone, MEMBERs can only remove themselves
    const requesterMembership = await db.teamMember.findFirst({
      where: { teamId, userId: session.user.id },
    });

    if (!requesterMembership) {
      return { success: false, error: "Unauthorized" };
    }

    const isSelf = member.userId === session.user.id;
    const isOwner = requesterMembership.role === "OWNER";

    if (!isSelf && !isOwner) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Cannot remove the team owner
    if (member.role === "OWNER") {
      return { success: false, error: "Cannot remove the team owner" };
    }

    await db.teamMember.delete({ where: { id: memberId } });

    revalidatePath("/teams");
    return { success: true, message: "Member removed successfully" };
  } catch (error) {
    console.error("removeTeamMember error:", error);
    return { success: false, error: "Failed to remove member" };
  }
}
