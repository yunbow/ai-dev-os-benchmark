import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTeamSchema } from "@/validations/team";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiInternalError,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = readRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            createdAt: true,
            _count: { select: { members: true, tasks: true } },
          },
        },
      },
    });

    const teams = memberships.map((m) => ({
      ...m.team,
      role: m.role,
    }));

    return apiSuccess(teams);
  } catch {
    return apiInternalError();
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = writeRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: { name: parsed.data.name, ownerId: session.user.id },
      });
      await tx.teamMember.create({
        data: { userId: session.user.id, teamId: created.id, role: "OWNER" },
      });
      return created;
    });
    return apiSuccess({ id: team.id, name: team.name, ownerId: team.ownerId, createdAt: team.createdAt }, 201);
  } catch {
    return apiInternalError();
  }
}
