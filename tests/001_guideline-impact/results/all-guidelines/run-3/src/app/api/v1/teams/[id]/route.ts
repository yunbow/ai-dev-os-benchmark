import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiRateLimited,
  apiInternalError,
  withRateLimitHeaders,
} from "@/lib/api-response";
import { requireTeamRole } from "@/lib/permissions";
import { TeamUpdateSchema } from "@/features/teams/schemas";

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

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!team) return apiNotFound("Team");

    return withRateLimitHeaders(
      apiSuccess(team),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[GET /api/v1/teams/:id]", error);
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

    const parsed = TeamUpdateSchema.safeParse(body);
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
    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });

    return withRateLimitHeaders(
      apiSuccess(team),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[PATCH /api/v1/teams/:id]", error);
    return apiInternalError();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.write);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const membership = await requireTeamRole(id, session.user.id, "OWNER");
    if (!("member" in membership)) {
      return apiError(membership.error.code, membership.error.message, 403);
    }

    await prisma.team.delete({ where: { id } });

    return withRateLimitHeaders(
      apiSuccess({ message: "Team deleted successfully" }),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[DELETE /api/v1/teams/:id]", error);
    return apiInternalError();
  }
}
