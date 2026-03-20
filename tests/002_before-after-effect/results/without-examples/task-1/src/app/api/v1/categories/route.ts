import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCategorySchema, sanitizeColor } from "@/lib/validations/category";
import { checkRateLimit, getRateLimitHeaders, getClientIp } from "@/lib/security/rate-limiter";
import type { ApiError } from "@/lib/types";

function errorResponse(code: string, message: string, status: number, details?: unknown[]): NextResponse<ApiError> {
  return NextResponse.json({ error: { code, message, details: details ?? [] } }, { status });
}

function checkCsrfOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!origin) return true;
  return origin === appUrl;
}

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`read:${clientIp}`, "read");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const userId = session.user.id;
  const { searchParams } = req.nextUrl;
  const teamId = searchParams.get("teamId") ?? undefined;

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!membership) return errorResponse("FORBIDDEN", "Access denied", 403);
  }

  const where = teamId ? { teamId } : { userId };

  const categories = await prisma.category.findMany({
    where,
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: "asc" },
  });

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json({ data: categories, nextCursor: null, hasMore: false }, { headers });
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  if (!checkCsrfOrigin(req)) return errorResponse("FORBIDDEN", "Invalid origin", 403);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid input", 400, parsed.error.issues);
  }

  const { name, color, teamId } = parsed.data;

  let sanitizedColor: string;
  try {
    sanitizedColor = sanitizeColor(color);
  } catch {
    return errorResponse("INVALID_COLOR", "Invalid color format", 400);
  }

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!membership || membership.role === "VIEWER") {
      return errorResponse("FORBIDDEN", "Insufficient permissions", 403);
    }
  }

  const category = await prisma.category.create({
    data: {
      name,
      color: sanitizedColor,
      userId: teamId ? null : userId,
      teamId: teamId ?? null,
    },
    include: { _count: { select: { tasks: true } } },
  });

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json(category, { status: 201, headers });
}
