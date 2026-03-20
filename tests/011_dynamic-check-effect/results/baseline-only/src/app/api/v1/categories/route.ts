import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/lib/validations/category";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  rateLimitResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { sanitizeHexColor } from "@/lib/utils";
import { TeamRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = readRateLimit.check(`read:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  const where = teamId
    ? { teamId }
    : { OR: [{ userId }, { team: { members: { some: { userId } } } }] };

  const categories = await prisma.category.findMany({
    where,
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: "asc" },
  });

  return successResponse(categories);
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

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const safeColor = sanitizeHexColor(parsed.data.color);
  if (!safeColor) {
    return errorResponse("VALIDATION_ERROR", "Invalid color format", 400);
  }

  const userId = session.user.id;

  if (parsed.data.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: parsed.data.teamId },
      select: { ownerId: true },
    });
    if (!team) return errorResponse("NOT_FOUND", "Team not found", 404);

    let hasAccess = team.ownerId === userId;
    if (!hasAccess) {
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId: parsed.data.teamId } },
        select: { role: true },
      });
      hasAccess = member !== null && member.role !== TeamRole.VIEWER;
    }
    if (!hasAccess) return forbiddenResponse();
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        color: safeColor,
        userId: parsed.data.teamId ? null : userId,
        teamId: parsed.data.teamId ?? null,
      },
      include: { _count: { select: { tasks: true } } },
    });
    return successResponse(category, 201);
  } catch {
    return internalErrorResponse();
  }
}
