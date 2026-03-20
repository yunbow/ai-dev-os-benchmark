import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema, sanitizeColor } from "@/lib/validations/category";
import { checkRateLimit, getRateLimitHeaders, getClientIp } from "@/lib/security/rate-limiter";
import type { ApiError } from "@/lib/types";
import { TeamRole } from "@prisma/client";

function errorResponse(code: string, message: string, status: number, details?: unknown[]): NextResponse<ApiError> {
  return NextResponse.json({ error: { code, message, details: details ?? [] } }, { status });
}

function checkCsrfOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!origin) return true;
  return origin === appUrl;
}

async function checkCategoryAccess(categoryId: string, userId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { tasks: true } } },
  });

  if (!category) return { category: null, hasAccess: false };

  if (category.userId === userId) return { category, hasAccess: true };

  if (category.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: category.teamId } },
    });
    if (membership && membership.role === TeamRole.OWNER) {
      return { category, hasAccess: true };
    }
  }

  return { category, hasAccess: false };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`read:${clientIp}`, "read");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { category, hasAccess } = await checkCategoryAccess(id, session.user.id);
  if (!category) return errorResponse("NOT_FOUND", "Category not found", 404);
  if (!hasAccess) return errorResponse("FORBIDDEN", "Access denied", 403);

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json(category, { headers });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  if (!checkCsrfOrigin(req)) return errorResponse("FORBIDDEN", "Invalid origin", 403);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { category, hasAccess } = await checkCategoryAccess(id, session.user.id);
  if (!category) return errorResponse("NOT_FOUND", "Category not found", 404);
  if (!hasAccess) return errorResponse("FORBIDDEN", "Access denied", 403);

  let body: unknown;
  try { body = await req.json(); } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) return errorResponse("VALIDATION_ERROR", "Invalid input", 400, parsed.error.issues);

  const { name, color } = parsed.data;
  let sanitizedColor: string | undefined;
  if (color) {
    try { sanitizedColor = sanitizeColor(color); } catch {
      return errorResponse("INVALID_COLOR", "Invalid color format", 400);
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(sanitizedColor ? { color: sanitizedColor } : {}),
    },
    include: { _count: { select: { tasks: true } } },
  });

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json(updated, { headers });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  if (!checkCsrfOrigin(req)) return errorResponse("FORBIDDEN", "Invalid origin", 403);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { category, hasAccess } = await checkCategoryAccess(id, session.user.id);
  if (!category) return errorResponse("NOT_FOUND", "Category not found", 404);
  if (!hasAccess) return errorResponse("FORBIDDEN", "Access denied", 403);

  await prisma.category.delete({ where: { id } });

  const headers = getRateLimitHeaders(rateLimitResult);
  return new NextResponse(null, { status: 204, headers });
}
