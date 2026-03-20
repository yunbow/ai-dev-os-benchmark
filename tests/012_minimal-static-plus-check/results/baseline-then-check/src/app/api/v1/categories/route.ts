import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/lib/validations";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";

function errorResponse(
  code: string,
  message: string,
  details: unknown[] = [],
  status = 400
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export async function GET(req: NextRequest) {
  const rateLimitResponse = readRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401);
  }

  const { searchParams } = req.nextUrl;
  const teamId = searchParams.get("teamId");

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!membership) {
      return errorResponse("FORBIDDEN", "Not a team member", [], 403);
    }
    const categories = await prisma.category.findMany({
      where: { teamId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: categories });
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: categories });
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = writeRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_REQUEST", "Invalid JSON body");
  }

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.issues);
  }

  const { name, color, teamId } = parsed.data;

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!membership || membership.role === "VIEWER") {
      return errorResponse("FORBIDDEN", "Insufficient permissions", [], 403);
    }
  }

  const category = await prisma.category.create({
    data: {
      name,
      color,
      userId: teamId ? null : session.user.id,
      teamId: teamId || null,
    },
  });

  return NextResponse.json({ data: category }, { status: 201 });
}
