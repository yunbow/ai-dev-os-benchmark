import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateCategorySchema } from "@/lib/validations/category";
import {
  apiSuccess,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiInternalError,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";
import { TeamRole } from "@prisma/client";

async function getCategoryWithAuth(categoryId: string, userId: string) {
  const category = await db.category.findUnique({
    where: { id: categoryId },
    include: {
      team: { include: { members: { where: { userId } } } },
    },
  });

  if (!category) return { category: null, canModify: false };

  const isOwner = category.userId === userId;
  const isTeamOwner = category.team?.members[0]?.role === TeamRole.OWNER;

  return { category, canModify: isOwner || isTeamOwner };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = readRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;
  const { category, canModify } = await getCategoryWithAuth(id, session.user.id);

  if (!category) return apiNotFound("Category not found");
  if (!canModify && category.teamId) return apiForbidden();

  return apiSuccess(category);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = writeRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;
  const { category, canModify } = await getCategoryWithAuth(id, session.user.id);

  if (!category) return apiNotFound("Category not found");
  if (!canModify) return apiForbidden();

  let body: unknown;
  try {
    body = await (req as NextRequest).json();
  } catch {
    return apiNotFound();
  }

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error.errors);

  try {
    const updated = await db.category.update({ where: { id }, data: parsed.data });
    return apiSuccess(updated);
  } catch {
    return apiInternalError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = writeRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;
  const { category, canModify } = await getCategoryWithAuth(id, session.user.id);

  if (!category) return apiNotFound("Category not found");
  if (!canModify) return apiForbidden();

  try {
    await db.category.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return apiInternalError();
  }
}
