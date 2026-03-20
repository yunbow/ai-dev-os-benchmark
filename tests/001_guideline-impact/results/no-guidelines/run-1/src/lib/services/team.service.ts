import { db } from "@/lib/db";
import { canInviteMembers, canManageMembers, canDeleteTeam, canAssignRole } from "@/lib/rbac";
import { sendTeamInvitationEmail } from "@/lib/email";
import type { CreateTeamInput, UpdateTeamInput, InviteMemberInput, UpdateMemberRoleInput } from "@/lib/validations/team";
import type { TeamWithMembers } from "@/types";
import type { Team, TeamRole } from "@prisma/client";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

async function getMemberRole(userId: string, teamId: string) {
  const member = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });
  return member?.role ?? null;
}

const TEAM_WITH_MEMBERS = {
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" as const },
  },
} as const;

export async function getTeams(userId: string): Promise<Team[]> {
  const memberships = await db.teamMember.findMany({
    where: { userId },
    include: { team: true },
    orderBy: { joinedAt: "desc" },
  });
  return memberships.map((m) => m.team);
}

export async function getTeamById(id: string, userId: string): Promise<TeamWithMembers> {
  const role = await getMemberRole(userId, id);
  if (!role) throw new Error("FORBIDDEN");

  const team = await db.team.findUnique({
    where: { id },
    include: TEAM_WITH_MEMBERS,
  });
  if (!team) throw new Error("NOT_FOUND");

  return team as TeamWithMembers;
}

export async function createTeam(data: CreateTeamInput, ownerId: string): Promise<Team> {
  let slug = generateSlug(data.name);

  // Ensure slug uniqueness
  const existing = await db.team.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  return db.$transaction(async (tx) => {
    const team = await tx.team.create({ data: { name: data.name, slug } });
    await tx.teamMember.create({
      data: { teamId: team.id, userId: ownerId, role: "OWNER" },
    });
    return team;
  });
}

export async function updateTeam(
  id: string,
  data: UpdateTeamInput,
  userId: string
): Promise<Team> {
  const role = await getMemberRole(userId, id);
  if (!role || !canDeleteTeam(role)) throw new Error("FORBIDDEN");

  return db.team.update({
    where: { id },
    data: { ...(data.name !== undefined && { name: data.name }) },
  });
}

export async function deleteTeam(id: string, userId: string): Promise<void> {
  const role = await getMemberRole(userId, id);
  if (!role || !canDeleteTeam(role)) throw new Error("FORBIDDEN");

  await db.team.delete({ where: { id } });
}

export async function inviteMember(
  teamId: string,
  data: InviteMemberInput,
  actorId: string
): Promise<void> {
  const actorRole = await getMemberRole(actorId, teamId);
  if (!actorRole || !canInviteMembers(actorRole)) throw new Error("FORBIDDEN");

  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team) throw new Error("NOT_FOUND");

  const actor = await db.user.findUnique({
    where: { id: actorId },
    select: { name: true, email: true },
  });

  // Check if user is already a member
  const existingUser = await db.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    const existingMember = await db.teamMember.findUnique({
      where: { userId_teamId: { userId: existingUser.id, teamId } },
    });
    if (existingMember) throw new Error("ALREADY_MEMBER");
  }

  // Invalidate any existing pending invitation for this email+team
  await db.teamInvitation.deleteMany({
    where: { email: data.email, teamId, usedAt: null },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await db.teamInvitation.create({
    data: {
      email: data.email,
      teamId,
      role: data.role,
      expiresAt,
      invitedById: actorId,
    },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${invitation.token}`;
  const inviterName = actor?.name ?? actor?.email ?? "A teammate";

  await sendTeamInvitationEmail(data.email, team.name, inviterName, inviteUrl);
}

export async function acceptInvitation(token: string, userId: string): Promise<void> {
  const invitation = await db.teamInvitation.findUnique({ where: { token } });

  if (!invitation) throw new Error("NOT_FOUND");
  if (invitation.usedAt) throw new Error("INVITATION_USED");
  if (invitation.expiresAt < new Date()) throw new Error("INVITATION_EXPIRED");

  const existingMember = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: invitation.teamId } },
  });
  if (existingMember) throw new Error("ALREADY_MEMBER");

  await db.$transaction(async (tx) => {
    await tx.teamMember.create({
      data: { userId, teamId: invitation.teamId, role: invitation.role },
    });
    await tx.teamInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });
  });
}

export async function updateMemberRole(
  teamId: string,
  targetUserId: string,
  data: UpdateMemberRoleInput,
  actorId: string
): Promise<void> {
  const actorRole = await getMemberRole(actorId, teamId);
  if (!actorRole || !canManageMembers(actorRole)) throw new Error("FORBIDDEN");
  if (!canAssignRole(actorRole, data.role as TeamRole)) throw new Error("FORBIDDEN");

  // Cannot change owner's role
  const targetMember = await db.teamMember.findUnique({
    where: { userId_teamId: { userId: targetUserId, teamId } },
  });
  if (!targetMember) throw new Error("NOT_FOUND");
  if (targetMember.role === "OWNER") throw new Error("CANNOT_CHANGE_OWNER");

  await db.teamMember.update({
    where: { userId_teamId: { userId: targetUserId, teamId } },
    data: { role: data.role },
  });
}

export async function removeMember(
  teamId: string,
  targetUserId: string,
  actorId: string
): Promise<void> {
  const actorRole = await getMemberRole(actorId, teamId);
  if (!actorRole || !canManageMembers(actorRole)) throw new Error("FORBIDDEN");

  const targetMember = await db.teamMember.findUnique({
    where: { userId_teamId: { userId: targetUserId, teamId } },
  });
  if (!targetMember) throw new Error("NOT_FOUND");
  if (targetMember.role === "OWNER") throw new Error("CANNOT_REMOVE_OWNER");

  await db.teamMember.delete({
    where: { userId_teamId: { userId: targetUserId, teamId } },
  });
}
