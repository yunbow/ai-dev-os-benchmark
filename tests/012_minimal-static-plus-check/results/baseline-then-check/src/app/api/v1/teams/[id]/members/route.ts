import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "@/lib/validations";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";
import { sendTeamInvitationEmail } from "@/lib/email";
import { generateToken } from "@/lib/utils";
import { TeamRole } from "@prisma/client";

function errorResponse(
  code: string,
  message: string,
  details: unknown[] = [],
  status = 400
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = readRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401);
  }

  const { id: teamId } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });

  if (!membership) {
    return errorResponse("NOT_FOUND", "Team not found", [], 404);
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: members });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = writeRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401);
  }

  const { id: teamId } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });

  if (!membership || membership.role === "VIEWER") {
    return errorResponse("FORBIDDEN", "Insufficient permissions", [], 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_REQUEST", "Invalid JSON body");
  }

  const parsed = inviteMemberSchema.safeParse({ ...body, teamId });
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.issues);
  }

  const { email, role } = parsed.data;

  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: existingUser.id } },
    });
    if (existingMember) {
      return errorResponse("CONFLICT", "User is already a team member", [], 409);
    }
  }

  // Invalidate old invitations
  await prisma.invitation.updateMany({
    where: { teamId, email, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({
    data: {
      teamId,
      email,
      role: role as TeamRole,
      token,
      senderId: session.user.id,
      expiresAt,
    },
  });

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  const sender = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  try {
    await sendTeamInvitationEmail(
      email,
      token,
      team?.name || "the team",
      sender?.name || "A team member"
    );
  } catch {
    // Silently fail email sending
  }

  return NextResponse.json({ data: invitation }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = writeRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401);
  }

  const { id: teamId } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });

  if (!membership || membership.role !== "OWNER") {
    return errorResponse("FORBIDDEN", "Only owners can change member roles", [], 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_REQUEST", "Invalid JSON body");
  }

  const parsed = updateMemberRoleSchema.safeParse({ ...body, teamId });
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.issues);
  }

  const { userId, role } = parsed.data;

  const updated = await prisma.teamMember.update({
    where: { teamId_userId: { teamId, userId } },
    data: { role: role as TeamRole },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({ data: updated });
}
