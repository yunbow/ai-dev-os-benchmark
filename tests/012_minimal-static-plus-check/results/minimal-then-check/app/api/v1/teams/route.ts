import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RateLimits } from "@/lib/api/rate-limit";
import { createTeamSchema } from "@/features/teams/schema";
import { prisma } from "@/lib/prisma/client";
import { TeamRole, type PrismaClient } from "@prisma/client";

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for") ?? "unknown";
}

export async function GET(req: NextRequest) {
  const ip = getIp(req);
  const { success: ok } = checkRateLimit(`api:read:${ip}`, RateLimits.read);
  if (!ok) return apiError("RATE_LIMITED", "Too many requests", [], 429);

  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "Unauthorized", [], 401);

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return apiSuccess(teams);
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const { success: ok } = checkRateLimit(`api:write:${ip}`, RateLimits.write);
  if (!ok) return apiError("RATE_LIMITED", "Too many requests", [], 429);

  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "Unauthorized", [], 401);

  const body = await req.json().catch(() => null);
  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  const team = await prisma.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
    const t = await tx.team.create({ data: parsed.data });
    await tx.teamMember.create({
      data: { teamId: t.id, userId: session.user!.id!, role: TeamRole.OWNER },
    });
    return t;
  });

  return apiSuccess(team, 201);
}
