import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTeamSchema } from "@/lib/validations/team";
import {
  apiSuccess,
  apiBadRequest,
  apiUnauthorized,
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
  const identifier = getIdentifier(request, "teams:read");
  const rateLimitResult = readRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");

    const teams = await db.team.findMany({
      where: {
        members: { some: { userId: session.user.id } },
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      include: {
        _count: { select: { members: true } },
        members: {
          where: { userId: session.user.id },
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 21,
    });

    const hasMore = teams.length > 20;
    const paginated = hasMore ? teams.slice(0, 20) : teams;
    const nextCursor = hasMore ? paginated[paginated.length - 1].id : null;

    const result = paginated.map((team) => ({
      ...team,
      currentUserRole: team.members[0]?.role,
      members: undefined,
    }));

    return apiPaginated(result, nextCursor, hasMore);
  } catch (error) {
    console.error("GET /api/v1/teams error:", error);
    return apiInternalError();
  }
}

export async function POST(request: NextRequest) {
  const identifier = getIdentifier(request, "teams:write");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  try {
    const body = await request.json();
    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return apiBadRequest("Validation failed", details);
    }

    const team = await db.team.create({
      data: {
        ...parsed.data,
        ownerId: session.user.id,
        members: {
          create: { userId: session.user.id, role: "OWNER" },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return apiSuccess(team, 201);
  } catch (error) {
    console.error("POST /api/v1/teams error:", error);
    return apiInternalError();
  }
}
