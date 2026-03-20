import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/validations/category";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiInternalError,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = readRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const teamId = req.nextUrl.searchParams.get("teamId");

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: session.user.id, teamId } },
    });
    if (!membership) return apiForbidden();
  }

  try {
    const categories = await prisma.category.findMany({
      where: teamId
        ? { teamId }
        : { userId: session.user.id, teamId: null },
      select: { id: true, name: true, color: true, teamId: true, userId: true },
      orderBy: { name: "asc" },
    });
    return apiSuccess(categories);
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

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const { teamId, ...rest } = parsed.data;

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: session.user.id, teamId } },
    });
    if (!membership || membership.role === "VIEWER") return apiForbidden();
  }

  try {
    const category = await prisma.category.create({
      data: {
        ...rest,
        userId: teamId ? null : session.user.id,
        teamId: teamId ?? null,
      },
      select: { id: true, name: true, color: true, teamId: true, userId: true },
    });
    return apiSuccess(category, 201);
  } catch {
    return apiInternalError();
  }
}
