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
import { TeamCreateSchema } from "@/features/teams/schemas";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.read);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const memberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      include: {
        team: {
          include: {
            _count: { select: { members: true, tasks: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
      take: 100,
    });

    const teams = memberships.map((m) => ({ ...m.team, myRole: m.role }));

    return withRateLimitHeaders(
      apiSuccess({ data: teams }),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[GET /api/v1/teams]", error);
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

    const parsed = TeamCreateSchema.safeParse(body);
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
    const userId = session.user.id;

    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: userId,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId,
          role: "OWNER",
        },
      });

      return newTeam;
    });

    return withRateLimitHeaders(
      apiSuccess(team, 201),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[POST /api/v1/teams]", error);
    return apiInternalError();
  }
}
