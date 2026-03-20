import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createTeamSchema } from "@/lib/validations/team";
import {
  apiSuccess,
  zodErrorResponse,
  unauthorizedResponse,
  rateLimitResponse,
  invalidBodyResponse,
} from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`read:${ip}`, RATE_LIMITS.read.limit, RATE_LIMITS.read.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const teams = await db.team.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      _count: { select: { members: true, tasks: true } },
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(teams);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`write:${ip}`, RATE_LIMITS.write.limit, RATE_LIMITS.write.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const body = await req.json().catch(() => null);
  if (!body) return invalidBodyResponse();

  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const userId = session.user.id;

  const team = await db.$transaction(async (tx) => {
    const t = await tx.team.create({
      data: { ...parsed.data, creatorId: userId },
    });
    await tx.teamMember.create({
      data: { teamId: t.id, userId, role: "OWNER" },
    });
    return t;
  });

  return apiSuccess(team, 201);
}
