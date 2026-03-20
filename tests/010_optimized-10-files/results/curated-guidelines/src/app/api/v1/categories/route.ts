import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { CreateCategorySchema } from "@/features/categories/schema/category-schema";
import { TeamRole } from "@prisma/client";
import type { NextRequest } from "next/server";

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return Response.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { success: rateLimitOk } = await checkRateLimit(`read:${session.user.id}`, RATE_LIMITS.read);
  if (!rateLimitOk) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests", 429);

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!membership) return errorResponse("FORBIDDEN", "You are not a member of this team", 403);
  }

  const categories = await prisma.category.findMany({
    where: teamId ? { teamId } : { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return Response.json({ data: categories });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { success: rateLimitOk } = await checkRateLimit(`write:${session.user.id}`, RATE_LIMITS.write);
  if (!rateLimitOk) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);
  }

  const parsed = CreateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const { teamId, ...rest } = parsed.data;

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!membership || membership.role === TeamRole.VIEWER) {
      return errorResponse("FORBIDDEN", "Insufficient permissions", 403);
    }
  }

  const category = await prisma.category.create({
    data: {
      ...rest,
      userId: teamId ? null : session.user.id,
      teamId: teamId ?? null,
    },
  });

  return Response.json(category, { status: 201 });
}
