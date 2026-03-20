import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

function errorResponse(
  code: string,
  message: string,
  status: number,
  details: unknown[] = []
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  const where: Prisma.CategoryWhereInput = {
    OR: [
      { userId },
      {
        team: {
          members: {
            some: { userId },
          },
        },
      },
    ],
  };

  if (teamId) {
    where.teamId = teamId;
  }

  const categories = await db.category.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json({ data: categories });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON in request body.", 400);
  }

  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid category data.",
      400,
      parsed.error.issues
    );
  }

  const { teamId, ...rest } = parsed.data;

  // Verify team membership if teamId provided
  if (teamId) {
    const member = await db.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!member || member.role === "VIEWER") {
      return errorResponse(
        "FORBIDDEN",
        "You do not have permission to create categories in this team.",
        403
      );
    }
  }

  const category = await db.category.create({
    data: {
      ...rest,
      userId: teamId ? null : userId,
      teamId: teamId ?? null,
    },
    include: {
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json({ data: category }, { status: 201 });
}
