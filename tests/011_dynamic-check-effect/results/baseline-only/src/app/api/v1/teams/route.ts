import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTeamSchema } from "@/lib/validations/team";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  rateLimitResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { TeamRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = readRateLimit.check(`read:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const userId = session.user.id;

  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          ownerId: true,
          _count: { select: { members: true, tasks: true } },
        },
      },
    },
  });

  const teams = memberships.map((m) => ({ ...m.team, role: m.role }));
  return successResponse(teams);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = writeRateLimit.check(`write:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const team = await prisma.team.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        ownerId: session.user.id,
        members: {
          create: { userId: session.user.id, role: TeamRole.OWNER },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        _count: { select: { members: true, tasks: true } },
      },
    });
    return successResponse(team, 201);
  } catch {
    return internalErrorResponse();
  }
}
