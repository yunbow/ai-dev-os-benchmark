"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamSchema, inviteMemberSchema } from "@/lib/validations";
import { sendTeamInvitationEmail } from "@/lib/email";
import type { ActionResult } from "@/actions/auth";
import type { Team, TeamMember, TeamInvitation } from "@prisma/client";
import crypto from "crypto";

type TeamWithDetails = Team & {
  owner: { id: string; name: string | null; email: string; image: string | null };
  members: (TeamMember & {
    user: { id: string; name: string | null; email: string; image: string | null };
  })[];
  _count: { tasks: number };
};

export async function createTeam(
  data: unknown
): Promise<ActionResult<TeamWithDetails>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;
  const parsed = teamSchema.safeParse(data);

  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      if (!details[field]) details[field] = [];
      details[field].push(issue.message);
    });
    return { success: false, error: "Validation failed", details };
  }

  const team = await db.$transaction(async (tx) => {
    const newTeam = await tx.team.create({
      data: {
        name: parsed.data.name,
        ownerId: userId,
      },
    });

    await tx.teamMember.create({
      data: {
        userId,
        teamId: newTeam.id,
        role: "OWNER",
      },
    });

    return tx.team.findUnique({
      where: { id: newTeam.id },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        _count: { select: { tasks: true } },
      },
    });
  });

  if (!team) {
    return { success: false, error: "Failed to create team." };
  }

  return { success: true, data: team as TeamWithDetails };
}

export async function updateTeam(
  id: string,
  data: unknown
): Promise<ActionResult<Team>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;

  const team = await db.team.findFirst({
    where: { id, ownerId: userId },
  });

  if (!team) {
    return { success: false, error: "Team not found or permission denied." };
  }

  const parsed = teamSchema.partial().safeParse(data);
  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      if (!details[field]) details[field] = [];
      details[field].push(issue.message);
    });
    return { success: false, error: "Validation failed", details };
  }

  const updated = await db.team.update({
    where: { id },
    data: parsed.data,
  });

  return { success: true, data: updated };
}

export async function deleteTeam(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;

  const team = await db.team.findFirst({
    where: { id, ownerId: userId },
  });

  if (!team) {
    return { success: false, error: "Team not found or permission denied." };
  }

  await db.team.delete({ where: { id } });

  return { success: true, data: { id } };
}

export async function inviteTeamMember(
  teamId: string,
  data: unknown
): Promise<ActionResult<TeamInvitation>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;

  const member = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!member || member.role === "VIEWER") {
    return { success: false, error: "You do not have permission to invite members." };
  }

  const parsed = inviteMemberSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid email address." };
  }

  const { email } = parsed.data;

  // Check if already a member
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await db.teamMember.findUnique({
      where: { userId_teamId: { userId: existingUser.id, teamId } },
    });
    if (existingMember) {
      return { success: false, error: "This user is already a member of the team." };
    }
  }

  // Check for existing pending invitation
  const existingInvite = await db.teamInvitation.findFirst({
    where: {
      email,
      teamId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvite) {
    return { success: false, error: "An invitation has already been sent to this email." };
  }

  const team = await db.team.findUnique({
    where: { id: teamId },
    include: { owner: { select: { name: true } } },
  });

  if (!team) {
    return { success: false, error: "Team not found." };
  }

  const inviter = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await db.teamInvitation.create({
    data: { email, teamId, token, expiresAt },
  });

  try {
    await sendTeamInvitationEmail(
      email,
      team.name,
      inviter?.name ?? "A team member",
      token
    );
  } catch (err) {
    console.error("Failed to send team invitation email:", err);
  }

  return { success: true, data: invitation };
}

export async function acceptTeamInvitation(
  token: string
): Promise<ActionResult<{ teamId: string; teamName: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;

  const invitation = await db.teamInvitation.findUnique({
    where: { token },
    include: { team: true },
  });

  if (!invitation) {
    return { success: false, error: "Invalid invitation token." };
  }

  if (invitation.usedAt) {
    return { success: false, error: "This invitation has already been used." };
  }

  if (invitation.expiresAt < new Date()) {
    return { success: false, error: "This invitation has expired." };
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: "User not found." };
  }

  // Verify email matches (optional but good security practice)
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return {
      success: false,
      error: "This invitation was sent to a different email address.",
    };
  }

  // Check if already a member
  const existingMember = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: invitation.teamId } },
  });

  if (existingMember) {
    return { success: false, error: "You are already a member of this team." };
  }

  await db.$transaction([
    db.teamMember.create({
      data: {
        userId,
        teamId: invitation.teamId,
        role: "MEMBER",
      },
    }),
    db.teamInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return {
    success: true,
    data: { teamId: invitation.teamId, teamName: invitation.team.name },
  };
}

export async function removeTeamMember(
  teamId: string,
  memberUserId: string
): Promise<ActionResult<{ userId: string; teamId: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;

  const requester = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!requester || requester.role !== "OWNER") {
    return { success: false, error: "Only the team owner can remove members." };
  }

  if (memberUserId === userId) {
    return { success: false, error: "Team owner cannot remove themselves." };
  }

  const targetMember = await db.teamMember.findUnique({
    where: { userId_teamId: { userId: memberUserId, teamId } },
  });

  if (!targetMember) {
    return { success: false, error: "Member not found in this team." };
  }

  await db.teamMember.delete({
    where: { userId_teamId: { userId: memberUserId, teamId } },
  });

  return { success: true, data: { userId: memberUserId, teamId } };
}
