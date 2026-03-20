import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inviteMemberSchema, updateMemberRoleSchema } from "@/lib/validations/team";
import {
  apiSuccess,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiError,
  apiInternalError,
  apiPaginated,
} from "@/lib/api-response";
import {
  writeRateLimiter,
  readRateLimiter,
  getIdentifier,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { generateSecureToken } from "@/lib/utils";
import { sendEmail, getTeamInvitationEmailHtml } from "@/lib/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "members:read");
  const rateLimitResult = readRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id: teamId } = await params;

  try {
    // Verify membership
    const membership = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });

    if (!membership) return apiForbidden("Not a team member");

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    const members = await db.teamMember.findMany({
      where: {
        teamId,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { joinedAt: "asc" },
      take: 21,
    });

    const hasMore = members.length > 20;
    const paginated = hasMore ? members.slice(0, 20) : members;
    const nextCursor = hasMore ? paginated[paginated.length - 1].id : null;

    return apiPaginated(paginated, nextCursor, hasMore);
  } catch (error) {
    console.error("GET /api/v1/teams/[id]/members error:", error);
    return apiInternalError();
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "members:write");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id: teamId } = await params;

  try {
    const body = await request.json();
    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return apiBadRequest("Validation failed", details);
    }

    // RBAC: only OWNER or MEMBER can invite
    const membership = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: { in: ["OWNER", "MEMBER"] },
      },
      include: { team: { select: { name: true } } },
    });

    if (!membership) return apiForbidden("Insufficient permissions");

    // Non-owners can only invite as MEMBER
    if (membership.role !== "OWNER" && parsed.data.role !== "MEMBER") {
      return apiForbidden("Only owners can invite with elevated roles");
    }

    // Check if user already a member
    const existingUser = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });

    if (existingUser) {
      const existingMember = await db.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: existingUser.id } },
      });
      if (existingMember) {
        return apiError("ALREADY_MEMBER", "User is already a team member", 409);
      }
    }

    // Invalidate existing invitations
    await db.teamInvitation.updateMany({
      where: { teamId, email: parsed.data.email, used: false },
      data: { used: true },
    });

    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.teamInvitation.create({
      data: {
        teamId,
        email: parsed.data.email,
        role: parsed.data.role,
        token,
        expiresAt,
      },
    });

    const inviteUrl = `${process.env.NEXTAUTH_URL}/accept-invitation?token=${token}`;
    sendEmail({
      to: parsed.data.email,
      subject: `You've been invited to join ${membership.team.name} on TaskFlow`,
      html: getTeamInvitationEmailHtml(membership.team.name, inviteUrl),
    }).catch((err) => console.error("Failed to send invitation email:", err));

    return apiSuccess({ message: "Invitation sent successfully" }, 201);
  } catch (error) {
    console.error("POST /api/v1/teams/[id]/members error:", error);
    return apiInternalError();
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "members:write");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id: teamId } = await params;

  try {
    const body = await request.json();
    const { memberId, ...roleData } = body;

    if (!memberId) return apiBadRequest("memberId is required");

    const parsed = updateMemberRoleSchema.safeParse(roleData);
    if (!parsed.success) {
      return apiBadRequest("Invalid role");
    }

    // RBAC: only OWNER can change roles
    const requester = await db.teamMember.findFirst({
      where: { teamId, userId: session.user.id, role: "OWNER" },
    });

    if (!requester) return apiForbidden("Only owners can change member roles");

    const target = await db.teamMember.findFirst({
      where: { id: memberId, teamId },
    });

    if (!target) return apiNotFound("Team member");
    if (target.role === "OWNER") return apiForbidden("Cannot change owner role");

    const updated = await db.teamMember.update({
      where: { id: memberId },
      data: { role: parsed.data.role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("PATCH /api/v1/teams/[id]/members error:", error);
    return apiInternalError();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "members:write");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id: teamId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) return apiBadRequest("memberId is required");

    const target = await db.teamMember.findFirst({
      where: { id: memberId, teamId },
    });

    if (!target) return apiNotFound("Team member");

    const requester = await db.teamMember.findFirst({
      where: { teamId, userId: session.user.id },
    });

    if (!requester) return apiUnauthorized();

    const isSelf = target.userId === session.user.id;
    const isOwner = requester.role === "OWNER";

    if (!isSelf && !isOwner) return apiForbidden("Insufficient permissions");
    if (target.role === "OWNER") return apiForbidden("Cannot remove team owner");

    await db.teamMember.delete({ where: { id: memberId } });

    return apiSuccess({ message: "Member removed successfully" });
  } catch (error) {
    console.error("DELETE /api/v1/teams/[id]/members error:", error);
    return apiInternalError();
  }
}
