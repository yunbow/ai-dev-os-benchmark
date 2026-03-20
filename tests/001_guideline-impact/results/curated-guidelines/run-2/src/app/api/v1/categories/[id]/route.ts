import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { UpdateCategorySchema } from "@/features/categories/schema/category-schema";
import { ActionErrors } from "@/lib/actions/errors";

function errorResponse(error: { code: string; message: string }, status: number) {
  return NextResponse.json({ error }, { status });
}

async function checkCategoryAccess(
  categoryId: string,
  userId: string,
  requireWrite = false
) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return { category: null, allowed: false };

  if (category.userId) {
    return { category, allowed: category.userId === userId };
  }

  if (category.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: category.teamId, userId } },
    });
    if (!member) return { category, allowed: false };
    if (requireWrite && member.role === "VIEWER") return { category, allowed: false };
    return { category, allowed: true };
  }

  return { category, allowed: false };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse(ActionErrors.unauthorized(), 401);

  const rl = rateLimit(`api:read:${session.user.id}`, 100, 60000);
  if (!rl.success) return errorResponse(ActionErrors.rateLimited(), 429);

  const { id } = await params;
  const { category, allowed } = await checkCategoryAccess(id, session.user.id);

  if (!category) return errorResponse({ code: "NOT_FOUND", message: "Category not found" }, 404);
  if (!allowed) return errorResponse(ActionErrors.forbidden(), 403);

  return NextResponse.json({ data: category }, { headers: rateLimitHeaders(rl) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse(ActionErrors.unauthorized(), 401);

  const rl = rateLimit(`api:write:${session.user.id}`, 30, 60000);
  if (!rl.success) return errorResponse(ActionErrors.rateLimited(), 429);

  const { id } = await params;
  const { category, allowed } = await checkCategoryAccess(id, session.user.id, true);

  if (!category) return errorResponse({ code: "NOT_FOUND", message: "Category not found" }, 404);
  if (!allowed) return errorResponse(ActionErrors.forbidden(), 403);

  const body = await req.json().catch(() => null);
  if (!body) return errorResponse(ActionErrors.badRequest("Invalid JSON"), 400);

  const parsed = UpdateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  const updated = await prisma.category.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: updated }, { headers: rateLimitHeaders(rl) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse(ActionErrors.unauthorized(), 401);

  const rl = rateLimit(`api:write:${session.user.id}`, 30, 60000);
  if (!rl.success) return errorResponse(ActionErrors.rateLimited(), 429);

  const { id } = await params;
  const { category, allowed } = await checkCategoryAccess(id, session.user.id, true);

  if (!category) return errorResponse({ code: "NOT_FOUND", message: "Category not found" }, 404);
  if (!allowed) return errorResponse(ActionErrors.forbidden(), 403);

  await prisma.category.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
