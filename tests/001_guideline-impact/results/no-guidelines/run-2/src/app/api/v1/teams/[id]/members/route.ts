import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { inviteMemberSchema, updateMemberRoleSchema } from "@/validations/team";
import { generateToken } from "@/lib/utils";
import { sendTeamInvitationEmail } from "@/lib/email";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiInternalError,
} from "@/lib/api-response";
import { writeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = writeRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id: teamId } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.user.id, teamId } },
  });
  if (!membership || membership.role !== "OWNER") return apiForbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const { email, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existing = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: existingUser.id, teamId } },
    });
    if (existing) {
      return apiError("ALREADY_MEMBER", "User is already a member of this team", 409);
    }
  }

  // Revoke existing pending invitations
  await prisma.teamInvitation.updateMany({
    where: { teamId, email, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = generateToken(48);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.teamInvitation.create({
    data: { email, teamId, token, expiresAt, invitedBy: session.user.id },
  });

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } });
  const inviter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite?token=${token}`;
  await sendTeamInvitationEmail(email, team?.name ?? "a team", inviter?.name ?? "Someone", inviteUrl);

  return apiSuccess({ message: "Invitation sent" }, 201);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = writeRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id: teamId } = await params;
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return apiError("MISSING_PARAM", "userId query param required", 400);

  if (userId !== session.user.id) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: session.user.id, teamId } },
    });
    if (!membership || membership.role !== "OWNER") return apiForbidden();
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return apiNotFound("Team");
  if (team.ownerId === userId) {
    return apiError("CANNOT_REMOVE_OWNER", "Team owner cannot be removed", 400);
  }

  const target = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (!target) return apiNotFound("Team member");

  try {
    await prisma.teamMember.delete({ where: { userId_teamId: { userId, teamId } } });
    return new Response(null, { status: 204 });
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = writeRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id: teamId } = await params;
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return apiError("MISSING_PARAM", "userId query param required", 400);

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.user.id, teamId } },
  });
  if (!membership || membership.role !== "OWNER") return apiForbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = updateMemberRoleSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    await prisma.teamMember.update({
      where: { userId_teamId: { userId, teamId } },
      data: { role: parsed.data.role },
    });
    return apiSuccess({ message: "Role updated" });
  } catch {
    return apiInternalError();
  }
}
