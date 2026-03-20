import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiRateLimited,
  apiInternalError,
  withRateLimitHeaders,
} from "@/lib/api-response";
import { requireTeamRole } from "@/lib/permissions";
import { CategoryCreateSchema } from "@/features/categories/schemas";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.read);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (teamId) {
      const membership = await requireTeamRole(teamId, session.user.id, "VIEWER");
      if (!("member" in membership)) {
        return apiError(membership.error.code, membership.error.message, 403);
      }
    }

    const categories = await prisma.category.findMany({
      where: teamId
        ? { teamId }
        : { userId: session.user.id, teamId: null },
      orderBy: { name: "asc" },
      take: 200,
    });

    return withRateLimitHeaders(
      apiSuccess({ data: categories }),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[GET /api/v1/categories]", error);
    return apiInternalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.write);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const body = await request.json().catch(() => null);
    if (!body) return apiError("INVALID_JSON", "Request body must be valid JSON", 400);

    const parsed = CategoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return apiValidationError(fieldErrors);
    }

    const data = parsed.data;

    if (data.teamId) {
      const membership = await requireTeamRole(data.teamId, session.user.id, "MEMBER");
      if (!("member" in membership)) {
        return apiError(membership.error.code, membership.error.message, 403);
      }
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        color: data.color,
        userId: session.user.id,
        teamId: data.teamId ?? null,
      },
    });

    return withRateLimitHeaders(
      apiSuccess(category, 201),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[POST /api/v1/categories]", error);
    return apiInternalError();
  }
}
