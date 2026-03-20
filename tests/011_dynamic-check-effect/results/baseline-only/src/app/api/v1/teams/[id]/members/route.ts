import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inviteMemberSchema, updateMemberRoleSchema } from "@/lib/validations/team";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  rateLimitResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { generateToken } from "@/lib/utils";
import { sendEmail, getTeamInvitationEmailHtml } from "@/lib/email";
import { TeamRole } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = readRateLimit.check(`read:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id: teamId } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.user.id, teamId } },
  });

  if (!membership) return notFoundResponse("Team");

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return successResponse(members);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = writeRateLimit.check(`write:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id: teamId } = await params;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true, name: true },
  });

  if (!team) return notFoundResponse("Team");
  if (team.ownerId !== session.user.id) return forbiddenResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true },
  });

  if (existingUser) {
    const existingMember = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: existingUser.id, teamId } },
    });
    if (existingMember) {
      return errorResponse("CONFLICT", "User is already a team member", 409);
    }
  }

  await prisma.teamInvitation.updateMany({
    where: { teamId, email: parsed.data.email.toLowerCase(), used: false },
    data: { used: true },
  });

  const token = generateToken(48);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
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
    await sendEmail({
      to: parsed.data.email,
      subject: `You're invited to join ${team.name}`,
      html: getTeamInvitationEmailHtml(
        inviteUrl,
        team.name,
        session.user.name ?? session.user.email ?? "A user"
      ),
    }).catch(console.error);

    return successResponse({ message: "Invitation sent" }, 201);
  } catch {
    return internalErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = writeRateLimit.check(`write:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id: teamId } = await params;
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("userId");

  if (!memberId) return errorResponse("VALIDATION_ERROR", "userId query param required", 400);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true },
  });

  if (!team) return notFoundResponse("Team");

  const canRemove = team.ownerId === session.user.id || memberId === session.user.id;
  if (!canRemove) return forbiddenResponse();
  if (memberId === team.ownerId) {
    return errorResponse("FORBIDDEN", "Cannot remove the team owner", 403);
  }

  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: memberId, teamId } },
  });

  if (!member) return notFoundResponse("Member");

  await prisma.teamMember.delete({
    where: { userId_teamId: { userId: memberId, teamId } },
  });

  return new Response(null, { status: 204 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = writeRateLimit.check(`write:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id: teamId } = await params;
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("userId");

  if (!memberId) return errorResponse("VALIDATION_ERROR", "userId query param required", 400);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true },
  });

  if (!team) return notFoundResponse("Team");
  if (team.ownerId !== session.user.id) return forbiddenResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = updateMemberRoleSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  if (parsed.data.role === TeamRole.OWNER) {
    return errorResponse("FORBIDDEN", "Cannot assign Owner role", 403);
  }

  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: memberId, teamId } },
  });

  if (!member) return notFoundResponse("Member");

  const updated = await prisma.teamMember.update({
    where: { userId_teamId: { userId: memberId, teamId } },
    data: { role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return successResponse(updated);
}
