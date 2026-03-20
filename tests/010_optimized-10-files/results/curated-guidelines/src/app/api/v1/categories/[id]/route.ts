import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { UpdateCategorySchema } from "@/features/categories/schema/category-schema";
import { TeamRole } from "@prisma/client";
import type { NextRequest } from "next/server";

function errorResponse(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

async function getCategoryWithAccess(categoryId: string, userId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return { category: null, error: errorResponse("NOT_FOUND", "Category not found", 404) };

  if (category.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: category.teamId, userId } },
    });
    if (!membership) return { category: null, error: errorResponse("FORBIDDEN", "Access denied", 403) };
  } else if (category.userId !== userId) {
    return { category: null, error: errorResponse("FORBIDDEN", "Access denied", 403) };
  }

  return { category, error: null };
}

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { success: rateLimitOk } = await checkRateLimit(`write:${session.user.id}`, RATE_LIMITS.write);
  if (!rateLimitOk) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests", 429);

  const { id } = await params;
  const { category, error } = await getCategoryWithAccess(id, session.user.id);
  if (error) return error;

  if (category!.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: category!.teamId, userId: session.user.id } },
    });
    if (!membership || membership.role === TeamRole.VIEWER) {
      return errorResponse("FORBIDDEN", "Insufficient permissions", 403);
    }
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);
  }

  const parsed = UpdateCategorySchema.partial().safeParse({ ...body, id });
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const { id: _id, ...data } = parsed.data;
  const updated = await prisma.category.update({ where: { id }, data });
  return Response.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { success: rateLimitOk } = await checkRateLimit(`write:${session.user.id}`, RATE_LIMITS.write);
  if (!rateLimitOk) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests", 429);

  const { id } = await params;
  const { category, error } = await getCategoryWithAccess(id, session.user.id);
  if (error) return error;

  if (category!.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: category!.teamId, userId: session.user.id } },
    });
    if (!membership || membership.role === TeamRole.VIEWER) {
      return errorResponse("FORBIDDEN", "Insufficient permissions", 403);
    }
  }

  await prisma.category.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
