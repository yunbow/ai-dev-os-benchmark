import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RateLimits } from "@/lib/api/rate-limit";
import { inviteMemberSchema } from "@/features/teams/schema";
import { prisma } from "@/lib/prisma/client";
import { TeamRole } from "@prisma/client";
import crypto from "crypto";
import { sendTeamInvitationEmail } from "@/lib/email";

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for") ?? "unknown";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getIp(req);
  const { success: ok } = checkRateLimit(`api:read:${ip}`, RateLimits.read);
  if (!ok) return apiError("RATE_LIMITED", "Too many requests", [], 429);

  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "Unauthorized", [], 401);

  const { id: teamId } = await params;
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });
  if (!member) return apiError("FORBIDDEN", "Forbidden", [], 403);

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return apiSuccess(members);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getIp(req);
  const { success: ok } = checkRateLimit(`api:write:${ip}`, RateLimits.write);
  if (!ok) return apiError("RATE_LIMITED", "Too many requests", [], 429);

  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "Unauthorized", [], 401);

  const { id: teamId } = await params;
  const ownerMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });
  if (!ownerMember || ownerMember.role !== TeamRole.OWNER) {
    return apiError("FORBIDDEN", "Forbidden", [], 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  const { email, role } = parsed.data;
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return apiError("NOT_FOUND", "Team not found", [], 404);

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.teamInvitation.create({
    data: { teamId, email, role, token, expiresAt, invitedBy: session.user.id },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL}/teams/accept-invite?token=${token}`;
  await sendTeamInvitationEmail(email, team.name, inviteUrl);

  return apiSuccess({ message: "Invitation sent" }, 201);
}
