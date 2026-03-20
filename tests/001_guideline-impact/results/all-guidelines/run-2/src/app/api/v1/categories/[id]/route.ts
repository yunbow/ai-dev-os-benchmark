import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, setRateLimitHeaders } from "@/lib/api/rate-limit";
import { CategorySchema } from "@/features/categories/schema/category-schema";
import { ZodError } from "zod";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message, details: [] } }, { status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return errorResponse("NOT_FOUND", "Category not found", 404);

  if (category.userId && category.userId !== session.user.id) return errorResponse("FORBIDDEN", "Access denied", 403);
  if (category.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: session.user.id, teamId: category.teamId } },
    });
    if (!member) return errorResponse("FORBIDDEN", "Access denied", 403);
  }

  return NextResponse.json(category);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getClientIp(req);
  const rl = checkRateLimit(`write:${ip}`, "write");
  const headers = new Headers();
  setRateLimitHeaders(headers, rl);
  if (!rl.allowed) return NextResponse.json({ error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests", details: [] } }, { status: 429, headers });

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return errorResponse("NOT_FOUND", "Category not found", 404);
  if (existing.userId && existing.userId !== session.user.id) return errorResponse("FORBIDDEN", "Access denied", 403);

  try {
    const body = await req.json();
    const validated = CategorySchema.partial().parse(body);
    const category = await prisma.category.update({ where: { id }, data: validated });
    return NextResponse.json(category, { headers });
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return errorResponse("NOT_FOUND", "Category not found", 404);
  if (existing.userId && existing.userId !== session.user.id) return errorResponse("FORBIDDEN", "Access denied", 403);

  await prisma.category.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
