import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiNotFound,
  apiRateLimited,
  apiInternalError,
  withRateLimitHeaders,
} from "@/lib/api-response";
import { requireTeamRole } from "@/lib/permissions";
import { InviteMemberSchema, UpdateMemberRoleSchema } from "@/features/teams/schemas";
import { sendTeamInvitationEmail } from "@/lib/email";
import { randomUUID } from "crypto";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.read);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const membership = await requireTeamRole(id, session.user.id, "VIEWER");
    if (!("member" in membership)) {
      return apiError(membership.error.code, membership.error.message, 403);
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    return withRateLimitHeaders(
      apiSuccess({ data: members }),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[GET /api/v1/teams/:id/members]", error);
    return apiInternalError();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.write);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const body = await request.json().catch(() => null);
    if (!body) return apiError("INVALID_JSON", "Request body must be valid JSON", 400);

    const parsed = InviteMemberSchema.safeParse({ ...body, teamId: id });
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return apiValidationError(fieldErrors);
    }

    const membership = await requireTeamRole(id, session.user.id, "OWNER");
    if (!("member" in membership)) {
      return apiError(membership.error.code, membership.error.message, 403);
    }

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) return apiNotFound("Team");

    const data = parsed.data;

    // Check for existing pending invitation
    const existingInvite = await prisma.teamInvitation.findFirst({
      where: { teamId: id, email: data.email, status: "PENDING" },
    });
    if (existingInvite) {
      return apiError("TEAM_INVITE_EXISTS", "An invitation has already been sent to this email", 409);
    }

    const token = randomUUID();
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId: id,
        email: data.email,
        role: data.role,
        token,
        senderId: session.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const sender = await prisma.user.findUnique({ where: { id: session.user.id } });

    await sendTeamInvitationEmail({
      to: data.email,
      teamName: team.name,
      inviterName: sender?.name ?? sender?.email ?? "A team member",
      inviteToken: token,
      appUrl,
    });

    return withRateLimitHeaders(
      apiSuccess(invitation, 201),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[POST /api/v1/teams/:id/members]", error);
    return apiInternalError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.write);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const body = await request.json().catch(() => null);
    if (!body) return apiError("INVALID_JSON", "Request body must be valid JSON", 400);

    const parsed = UpdateMemberRoleSchema.safeParse({ ...body, teamId: id });
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return apiValidationError(fieldErrors);
    }

    const membership = await requireTeamRole(id, session.user.id, "OWNER");
    if (!("member" in membership)) {
      return apiError(membership.error.code, membership.error.message, 403);
    }

    const data = parsed.data;

    const targetMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: id, userId: data.userId } },
    });
    if (!targetMember) return apiNotFound("Team member");

    if (targetMember.role === "OWNER") {
      return apiError("TEAM_CANNOT_CHANGE_OWNER_ROLE", "Cannot change the owner's role", 400);
    }

    const updated = await prisma.teamMember.update({
      where: { teamId_userId: { teamId: id, userId: data.userId } },
      data: { role: data.role },
    });

    return withRateLimitHeaders(
      apiSuccess(updated),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[PATCH /api/v1/teams/:id/members]", error);
    return apiInternalError();
  }
}
