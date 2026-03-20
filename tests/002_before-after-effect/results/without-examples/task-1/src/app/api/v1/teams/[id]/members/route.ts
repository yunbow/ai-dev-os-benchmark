import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { inviteMemberSchema, updateMemberRoleSchema } from "@/lib/validations/team";
import { checkRateLimit, getRateLimitHeaders, getClientIp } from "@/lib/security/rate-limiter";
import { sendInviteEmail } from "@/lib/email";
import type { ApiError } from "@/lib/types";
import { TeamRole } from "@prisma/client";
import crypto from "crypto";

function errorResponse(code: string, message: string, status: number, details?: unknown[]): NextResponse<ApiError> {
  return NextResponse.json({ error: { code, message, details: details ?? [] } }, { status });
}

function checkCsrfOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!origin) return true;
  return origin === appUrl;
}

async function getMembership(teamId: string, userId: string) {
  return prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
}

// GET /api/v1/teams/:id/members - List team members
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`read:${clientIp}`, "read");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const membership = await getMembership(teamId, session.user.id);
  if (!membership) return errorResponse("FORBIDDEN", "You are not a member of this team", 403);

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json({ data: members, nextCursor: null, hasMore: false }, { headers });
}

// POST /api/v1/teams/:id/members - Invite a member
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  if (!checkCsrfOrigin(req)) return errorResponse("FORBIDDEN", "Invalid origin", 403);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const userId = session.user.id;
  const membership = await getMembership(teamId, userId);

  if (!membership) return errorResponse("FORBIDDEN", "You are not a member of this team", 403);

  // Only OWNER or MEMBER can invite
  if (membership.role === TeamRole.VIEWER) {
    return errorResponse("FORBIDDEN", "Viewers cannot invite members", 403);
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) return errorResponse("VALIDATION_ERROR", "Invalid input", 400, parsed.error.issues);

  const { email, role } = parsed.data;

  // Only OWNER can invite as OWNER
  if (role === TeamRole.OWNER && membership.role !== TeamRole.OWNER) {
    return errorResponse("FORBIDDEN", "Only owners can invite other owners", 403);
  }

  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    const existingMembership = await getMembership(teamId, existingUser.id);
    if (existingMembership) return errorResponse("CONFLICT", "User is already a member", 409);
  }

  // Check for pending invitation
  const pendingInvite = await prisma.teamInvitation.findFirst({
    where: { teamId, email, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (pendingInvite) return errorResponse("CONFLICT", "Invitation already pending for this email", 409);

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true } });
  if (!team) return errorResponse("NOT_FOUND", "Team not found", 404);

  const inviter = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });

  const token = crypto.randomBytes(32).toString("hex");

  await prisma.teamInvitation.create({
    data: {
      teamId,
      email,
      token,
      role,
      invitedById: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  try {
    await sendInviteEmail({
      email,
      inviterName: inviter?.name ?? inviter?.email ?? "A team member",
      teamName: team.name,
      token,
    });
  } catch {
    return errorResponse("EMAIL_ERROR", "Failed to send invitation email", 500);
  }

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json({ message: "Invitation sent" }, { status: 201, headers });
}

const updateRoleBodySchema = updateMemberRoleSchema.extend({
  memberId: z.string().cuid(),
});

// PATCH /api/v1/teams/:id/members - Update member role (body: { memberId, role })
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  if (!checkCsrfOrigin(req)) return errorResponse("FORBIDDEN", "Invalid origin", 403);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const userId = session.user.id;
  const membership = await getMembership(teamId, userId);

  if (!membership || membership.role !== TeamRole.OWNER) {
    return errorResponse("FORBIDDEN", "Only owners can change member roles", 403);
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = updateRoleBodySchema.safeParse(body);
  if (!parsed.success) return errorResponse("VALIDATION_ERROR", "Invalid input", 400, parsed.error.issues);

  const { memberId, role } = parsed.data;

  const targetMembership = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!targetMembership || targetMembership.teamId !== teamId) {
    return errorResponse("NOT_FOUND", "Member not found", 404);
  }

  if (targetMembership.role === TeamRole.OWNER) {
    return errorResponse("FORBIDDEN", "Cannot change owner's role", 403);
  }

  await prisma.teamMember.update({ where: { id: memberId }, data: { role } });

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json({ message: "Role updated" }, { headers });
}

// DELETE /api/v1/teams/:id/members?memberId=xxx - Remove member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  if (!checkCsrfOrigin(req)) return errorResponse("FORBIDDEN", "Invalid origin", 403);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const userId = session.user.id;
  const membership = await getMembership(teamId, userId);
  if (!membership) return errorResponse("FORBIDDEN", "Access denied", 403);

  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!memberId) return errorResponse("VALIDATION_ERROR", "memberId is required", 400);

  const targetMembership = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!targetMembership || targetMembership.teamId !== teamId) {
    return errorResponse("NOT_FOUND", "Member not found", 404);
  }

  // IDOR: only OWNER can remove others; anyone can remove themselves
  if (targetMembership.userId !== userId && membership.role !== TeamRole.OWNER) {
    return errorResponse("FORBIDDEN", "Insufficient permissions", 403);
  }

  if (targetMembership.role === TeamRole.OWNER) {
    return errorResponse("FORBIDDEN", "Cannot remove the team owner", 403);
  }

  await prisma.teamMember.delete({ where: { id: memberId } });

  const headers = getRateLimitHeaders(rateLimitResult);
  return new NextResponse(null, { status: 204, headers });
}
