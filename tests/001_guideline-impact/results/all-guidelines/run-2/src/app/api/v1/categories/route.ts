import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, setRateLimitHeaders } from "@/lib/api/rate-limit";
import { CategorySchema } from "@/features/categories/schema/category-schema";
import { ZodError } from "zod";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message, details: [] } }, { status });
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`read:${ip}`, "read");
  const headers = new Headers();
  setRateLimitHeaders(headers, rl);
  if (!rl.allowed) return NextResponse.json({ error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests", details: [] } }, { status: 429, headers });

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const teamId = req.nextUrl.searchParams.get("teamId");

  const categories = await prisma.category.findMany({
    where: teamId ? { teamId } : { userId: session.user.id, teamId: null },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: categories, nextCursor: null, hasMore: false }, { headers });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`write:${ip}`, "write");
  const headers = new Headers();
  setRateLimitHeaders(headers, rl);
  if (!rl.allowed) return NextResponse.json({ error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests", details: [] } }, { status: 429, headers });

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  try {
    const body = await req.json();
    const validated = CategorySchema.parse(body);

    if (validated.teamId) {
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: session.user.id, teamId: validated.teamId } },
      });
      if (!member || member.role === "VIEWER") return errorResponse("FORBIDDEN", "Insufficient permissions", 403);
    }

    const category = await prisma.category.create({
      data: { ...validated, userId: validated.teamId ? null : session.user.id },
    });

    return NextResponse.json(category, { status: 201, headers });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
    }
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
