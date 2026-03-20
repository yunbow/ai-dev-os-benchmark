import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { CreateCategorySchema } from "@/features/category/schema/category-schema";

function errorResponse(
  code: string,
  message: string,
  details: unknown[] = [],
  status = 400,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status, headers: extraHeaders }
  );
}

export async function GET(req: NextRequest) {
  const rl = applyRateLimit(req, "read");
  if (!rl.allowed) return rl.response!;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401, rl.headers);
  }

  const url = new URL(req.url);
  const teamId = url.searchParams.get("teamId");

  try {
    let categories;

    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: session.user.id } },
      });
      if (!membership) {
        return errorResponse("FORBIDDEN", "You are not a member of this team", [], 403, rl.headers);
      }
      categories = await prisma.category.findMany({
        where: { teamId },
        orderBy: { name: "asc" },
      });
    } else {
      categories = await prisma.category.findMany({
        where: { userId: session.user.id },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ data: categories }, { headers: rl.headers });
  } catch {
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", [], 500, rl.headers);
  }
}

export async function POST(req: NextRequest) {
  const rl = applyRateLimit(req, "write");
  if (!rl.allowed) return rl.response!;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401, rl.headers);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_JSON", "Request body must be valid JSON", [], 400, rl.headers);
  }

  const parsed = CreateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid input",
      parsed.error.errors,
      400,
      rl.headers
    );
  }

  const { name, color, teamId } = parsed.data;

  try {
    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: session.user.id } },
      });
      if (!membership) {
        return errorResponse("FORBIDDEN", "You are not a member of this team", [], 403, rl.headers);
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        color: color.toUpperCase(),
        userId: teamId ? null : session.user.id,
        teamId: teamId ?? null,
      },
    });

    return NextResponse.json({ data: category }, { status: 201, headers: rl.headers });
  } catch {
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", [], 500, rl.headers);
  }
}
