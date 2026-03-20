import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateTeamSchema } from "@/lib/validations/team";
import {
  apiSuccess,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiInternalError,
} from "@/lib/api-response";
import {
  writeRateLimiter,
  readRateLimiter,
  getIdentifier,
  rateLimitResponse,
} from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "teams:read");
  const rateLimitResult = readRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  try {
    const team = await db.team.findFirst({
      where: {
        id,
        members: { some: { userId: session.user.id } },
      },
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!team) return apiNotFound("Team");

    return apiSuccess(team);
  } catch (error) {
    console.error("GET /api/v1/teams/[id] error:", error);
    return apiInternalError();
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "teams:write");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateTeamSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return apiBadRequest("Validation failed", details);
    }

    // RBAC: only OWNER
    const membership = await db.teamMember.findFirst({
      where: { teamId: id, userId: session.user.id, role: "OWNER" },
    });

    if (!membership) {
      return apiForbidden("Only team owners can update team settings");
    }

    const team = await db.team.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { members: true } } },
    });

    return apiSuccess(team);
  } catch (error) {
    console.error("PATCH /api/v1/teams/[id] error:", error);
    return apiInternalError();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "teams:write");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  try {
    const team = await db.team.findFirst({
      where: { id, ownerId: session.user.id },
    });

    if (!team) return apiNotFound("Team");

    await db.team.delete({ where: { id } });

    return apiSuccess({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/v1/teams/[id] error:", error);
    return apiInternalError();
  }
}
