import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { CreateCategorySchema } from "@/features/categories/schema/category-schema";
import { ActionErrors } from "@/lib/actions/errors";

function errorResponse(error: { code: string; message: string }, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(ActionErrors.unauthorized(), 401);
  }

  const rl = rateLimit(`api:read:${session.user.id}`, 100, 60000);
  if (!rl.success) {
    return errorResponse(ActionErrors.rateLimited(), 429);
  }

  const url = new URL(req.url);
  const teamId = url.searchParams.get("teamId") ?? undefined;

  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        ...(teamId ? [{ teamId }] : []),
      ],
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: categories }, { headers: rateLimitHeaders(rl) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(ActionErrors.unauthorized(), 401);
  }

  const rl = rateLimit(`api:write:${session.user.id}`, 30, 60000);
  if (!rl.success) {
    return errorResponse(ActionErrors.rateLimited(), 429);
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return errorResponse(ActionErrors.badRequest("Invalid JSON"), 400);
  }

  const parsed = CreateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 422 }
    );
  }

  const { teamId, ...rest } = parsed.data;

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!membership || membership.role === "VIEWER") {
      return errorResponse(ActionErrors.forbidden(), 403);
    }
  }

  const category = await prisma.category.create({
    data: {
      ...rest,
      userId: teamId ? null : session.user.id,
      teamId: teamId ?? null,
    },
  });

  return NextResponse.json({ data: category }, { status: 201, headers: rateLimitHeaders(rl) });
}
