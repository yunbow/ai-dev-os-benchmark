import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCategorySchema } from "@/lib/validations/category";
import {
  apiSuccess,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
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

export async function GET(request: NextRequest) {
  const identifier = getIdentifier(request, "categories:read");
  const rateLimitResult = readRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    const cursor = searchParams.get("cursor");

    const where = teamId
      ? {
          teamId,
          team: { members: { some: { userId: session.user.id } } },
        }
      : { userId: session.user.id, teamId: null };

    const categories = await db.category.findMany({
      where: {
        ...where,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { name: "asc" },
      take: 21,
    });

    const hasMore = categories.length > 20;
    const paginated = hasMore ? categories.slice(0, 20) : categories;
    const nextCursor = hasMore ? paginated[paginated.length - 1].id : null;

    return apiPaginated(paginated, nextCursor, hasMore);
  } catch (error) {
    console.error("GET /api/v1/categories error:", error);
    return apiInternalError();
  }
}

export async function POST(request: NextRequest) {
  const identifier = getIdentifier(request, "categories:write");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  try {
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return apiBadRequest("Validation failed", details);
    }

    const { teamId, color, ...rest } = parsed.data;

    // Sanitize color server-side
    const safeColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#6366f1";

    if (teamId) {
      const membership = await db.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: session.user.id } },
      });
      if (!membership) return apiForbidden("Not a team member");
      if (membership.role === "VIEWER") return apiForbidden("Viewers cannot create categories");
    }

    // Check duplicate
    const existing = await db.category.findFirst({
      where: teamId
        ? { teamId, name: { equals: rest.name, mode: "insensitive" } }
        : {
            userId: session.user.id,
            teamId: null,
            name: { equals: rest.name, mode: "insensitive" },
          },
    });

    if (existing) {
      return apiError(
        "DUPLICATE_NAME",
        "A category with this name already exists",
        409
      );
    }

    const category = await db.category.create({
      data: {
        ...rest,
        color: safeColor,
        userId: teamId ? null : session.user.id,
        teamId: teamId ?? null,
      },
    });

    return apiSuccess(category, 201);
  } catch (error) {
    console.error("POST /api/v1/categories error:", error);
    return apiInternalError();
  }
}
