import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inviteMemberSchema } from "@/lib/validations/team";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiInternalError,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";
import { TeamRole } from "@prisma/client";
import { sendTeamInvitationEmail } from "@/lib/email";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = readRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id: teamId } = await params;

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });
  if (!member) return apiForbidden();

  try {
    const members = await db.teamMember.findMany({
      where: { teamId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { joinedAt: "asc" },
    });

    return apiSuccess(members);
  } catch {
    return apiInternalError();
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = writeRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id: teamId } = await params;

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });
  if (!member || member.role !== TeamRole.OWNER) return apiForbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Invalid JSON body", details: [] }, 400);
  }

  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error.errors);

  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team) return apiNotFound("Team not found");

  try {
    await db.teamInvitation.updateMany({
      where: { teamId, email: parsed.data.email, acceptedAt: null },
      data: { expiresAt: new Date(0) },
    });

    const invitation = await db.teamInvitation.create({
      data: {
        teamId,
        email: parsed.data.email,
        role: parsed.data.role,
        invitedById: session.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const inviter = await db.user.findUnique({ where: { id: session.user.id } });

    await sendTeamInvitationEmail(
      parsed.data.email,
      team.name,
      inviter?.name ?? "A team member",
      invitation.token,
    );

    return apiSuccess(invitation, 201);
  } catch {
    return apiInternalError();
  }
}
