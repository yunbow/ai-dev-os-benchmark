import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { InviteMemberSchema } from "@/features/teams/schema/team-schema";
import { ActionErrors } from "@/lib/actions/errors";
import { sendTeamInvitationEmail } from "@/lib/email";
import crypto from "crypto";

function errorResponse(error: { code: string; message: string }, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse(ActionErrors.unauthorized(), 401);

  const rl = rateLimit(`api:read:${session.user.id}`, 100, 60000);
  if (!rl.success) return errorResponse(ActionErrors.rateLimited(), 429);

  const { id: teamId } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });

  if (!membership) return errorResponse({ code: "NOT_FOUND", message: "Team not found" }, 404);

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ data: members }, { headers: rateLimitHeaders(rl) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse(ActionErrors.unauthorized(), 401);

  const rl = rateLimit(`api:write:${session.user.id}`, 30, 60000);
  if (!rl.success) return errorResponse(ActionErrors.rateLimited(), 429);

  const { id: teamId } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
    include: { team: true },
  });

  if (!membership) return errorResponse({ code: "NOT_FOUND", message: "Team not found" }, 404);
  if (membership.role === "VIEWER") return errorResponse(ActionErrors.forbidden(), 403);

  const body = await req.json().catch(() => null);
  if (!body) return errorResponse(ActionErrors.badRequest("Invalid JSON"), 400);

  const parsed = InviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  const { email, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: existingUser.id } },
    });
    if (existingMember) {
      return errorResponse({ code: "CONFLICT", message: "User is already a team member" }, 409);
    }
  }

  await prisma.teamInvitation.updateMany({
    where: { teamId, email, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.teamInvitation.create({
    data: { teamId, email, token, role, expiresAt },
  });

  const inviter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  await sendTeamInvitationEmail(
    email,
    membership.team.name,
    inviter?.name ?? inviter?.email ?? "A team member",
    token
  );

  return NextResponse.json({ data: invitation }, { status: 201, headers: rateLimitHeaders(rl) });
}
