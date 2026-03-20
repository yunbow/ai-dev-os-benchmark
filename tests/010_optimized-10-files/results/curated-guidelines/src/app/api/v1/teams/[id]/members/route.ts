import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { InviteMemberSchema } from "@/features/teams/schema/team-schema";
import { TeamRole } from "@prisma/client";
import crypto from "crypto";
import { sendTeamInvitationEmail } from "@/lib/email";
import type { NextRequest } from "next/server";

function errorResponse(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id: teamId } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });
  if (!membership) return errorResponse("FORBIDDEN", "You are not a member of this team", 403);

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return Response.json({ data: members });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { success: rateLimitOk } = await checkRateLimit(`invite:${session.user.id}`, RATE_LIMITS.invite);
  if (!rateLimitOk) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests", 429);

  const { id: teamId } = await params;

  const ownership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });
  if (!ownership || ownership.role !== TeamRole.OWNER) {
    return errorResponse("FORBIDDEN", "Only team owners can invite members", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);
  }

  const parsed = InviteMemberSchema.safeParse({ ...body, teamId });
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.teamInvitation.create({
    data: {
      teamId,
      email: parsed.data.email,
      token,
      role: parsed.data.role,
      invitedBy: session.user.id,
      expiresAt,
    },
    include: {
      team: { select: { name: true } },
      inviter: { select: { name: true, email: true } },
    },
  });

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  sendTeamInvitationEmail({
    to: parsed.data.email,
    teamName: invitation.team.name,
    inviterName: invitation.inviter.name ?? invitation.inviter.email,
    inviteLink: `${baseUrl}/invitations/accept?token=${token}`,
  }).catch((err) => console.error("Failed to send invitation email:", err));

  return Response.json({ message: "Invitation sent" }, { status: 201 });
}
