import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { inviteMemberSchema } from "@/lib/validations/team";
import { sendTeamInvitationEmail } from "@/lib/email";
import {
  apiSuccess,
  zodErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  rateLimitResponse,
  invalidBodyResponse,
} from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`read:${ip}`, RATE_LIMITS.read.limit, RATE_LIMITS.read.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id: teamId } = await params;
  const userId = session.user.id;

  const myMembership = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (!myMembership) return forbiddenResponse();

  const members = await db.teamMember.findMany({
    where: { teamId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return apiSuccess(members);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`write:${ip}`, RATE_LIMITS.write.limit, RATE_LIMITS.write.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id: teamId } = await params;
  const userId = session.user.id;

  const myMembership = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (!myMembership || myMembership.role === "VIEWER") return forbiddenResponse();

  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team) return notFoundResponse("Team");

  const body = await req.json().catch(() => null);
  if (!body) return invalidBodyResponse();

  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const inviter = await db.user.findUnique({ where: { id: userId }, select: { name: true } });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invitation = await db.teamInvitation.create({
    data: { teamId, email: parsed.data.email, role: parsed.data.role, expiresAt },
  });

  await sendTeamInvitationEmail(
    parsed.data.email,
    team.name,
    inviter?.name ?? "A teammate",
    invitation.token
  );

  return apiSuccess({ message: "Invitation sent" }, 201);
}
