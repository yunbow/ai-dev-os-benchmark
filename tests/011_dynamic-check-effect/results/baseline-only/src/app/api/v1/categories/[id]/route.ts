import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/validations/category";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  rateLimitResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { sanitizeHexColor } from "@/lib/utils";

async function checkCategoryAccess(categoryId: string, userId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { userId: true, teamId: true },
  });

  if (!category) return null;

  let hasAccess = category.userId === userId;
  if (!hasAccess && category.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: category.teamId } },
    });
    hasAccess = member !== null;
  }

  let canEdit = category.userId === userId;
  if (!canEdit && category.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: category.teamId },
      select: { ownerId: true },
    });
    canEdit = team?.ownerId === userId;
  }

  return hasAccess ? { category, canEdit } : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = readRateLimit.check(`read:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const result = await checkCategoryAccess(id, session.user.id);
  if (!result) return notFoundResponse("Category");

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { tasks: true } } },
  });

  return successResponse(category);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = writeRateLimit.check(`write:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const result = await checkCategoryAccess(id, session.user.id);
  if (!result) return notFoundResponse("Category");
  if (!result.canEdit) return forbiddenResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.color) {
    const safeColor = sanitizeHexColor(parsed.data.color);
    if (!safeColor) return errorResponse("VALIDATION_ERROR", "Invalid color format", 400);
    updateData.color = safeColor;
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { tasks: true } } },
    });
    return successResponse(category);
  } catch {
    return internalErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = writeRateLimit.check(`write:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const result = await checkCategoryAccess(id, session.user.id);
  if (!result) return notFoundResponse("Category");
  if (!result.canEdit) return forbiddenResponse();

  await prisma.category.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
