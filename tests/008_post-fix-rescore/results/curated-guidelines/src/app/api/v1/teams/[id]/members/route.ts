import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { InviteMemberSchema } from "@/features/team/schema/team-schema";
import {
  assertTeamMembership,
  getTeamWithMembers,
} from "@/features/team/services/team-service";
import { sendTeamInvitationEmail } from "@/lib/email";
import { TeamRole } from "@prisma/client";
import crypto from "crypto";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(
  code: string,
  message: string,
  details: unknown[] = [],
  status = 400,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status, headers: extraHeaders }
  );
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const rl = applyRateLimit(req, "read");
  if (!rl.allowed) return rl.response!;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401, rl.headers);
  }

  const { id: teamId } = await params;

  try {
    const { allowed } = await assertTeamMembership(teamId, session.user.id);
    if (!allowed) {
      return errorResponse("NOT_FOUND", "Team not found", [], 404, rl.headers);
    }

    const team = await getTeamWithMembers(teamId);
    if (!team) return errorResponse("NOT_FOUND", "Team not found", [], 404, rl.headers);

    const members = team.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      user: m.user,
      joinedAt: m.createdAt,
    }));

    return NextResponse.json({ data: members }, { headers: rl.headers });
  } catch {
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", [], 500, rl.headers);
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const rl = applyRateLimit(req, "write");
  if (!rl.allowed) return rl.response!;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401, rl.headers);
  }

  const { id: teamId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_JSON", "Request body must be valid JSON", [], 400, rl.headers);
  }

  const parsed = InviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid input",
      parsed.error.errors,
      400,
      rl.headers
    );
  }

  const { email, role } = parsed.data;

  try {
    const { allowed, role: callerRole } = await assertTeamMembership(
      teamId,
      session.user.id
    );
    if (!allowed) return errorResponse("NOT_FOUND", "Team not found", [], 404, rl.headers);
    if (callerRole !== TeamRole.OWNER) {
      return errorResponse("FORBIDDEN", "Only team owners can invite members", [], 403, rl.headers);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      const existing = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: existingUser.id } },
      });
      if (existing) {
        return errorResponse("ALREADY_MEMBER", "This user is already a team member", [], 409, rl.headers);
      }
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    });
    if (!team) return errorResponse("NOT_FOUND", "Team not found", [], 404, rl.headers);

    await prisma.teamInvitation.updateMany({
      where: { teamId, email, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        email,
        token,
        role,
        invitedBy: session.user.id,
        expiresAt,
      },
      select: { id: true, email: true, role: true, expiresAt: true },
    });

    await sendTeamInvitationEmail(
      email,
      session.user?.name ?? null,
      team.name,
      token
    );

    return NextResponse.json({ data: invitation }, { status: 201, headers: rl.headers });
  } catch {
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", [], 500, rl.headers);
  }
}
