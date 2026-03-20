import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema } from "@/validations/category";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiInternalError,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

async function canAccess(
  userId: string,
  category: { userId: string | null; teamId: string | null },
  requireWrite = false
): Promise<boolean> {
  if (category.userId === userId) return true;
  if (category.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: category.teamId } },
    });
    if (!membership) return false;
    if (requireWrite) return membership.role !== "VIEWER";
    return true;
  }
  return false;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = readRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true, color: true, teamId: true, userId: true },
  });

  if (!category) return apiNotFound("Category");
  if (!(await canAccess(session.user.id, category))) return apiForbidden();

  return apiSuccess(category);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = writeRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) return apiNotFound("Category");
  if (!(await canAccess(session.user.id, category, true))) return apiForbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: parsed.data,
      select: { id: true, name: true, color: true, teamId: true, userId: true },
    });
    return apiSuccess(updated);
  } catch {
    return apiInternalError();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = writeRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) return apiNotFound("Category");
  if (!(await canAccess(session.user.id, category, true))) return apiForbidden();

  try {
    await prisma.category.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return apiInternalError();
  }
}
