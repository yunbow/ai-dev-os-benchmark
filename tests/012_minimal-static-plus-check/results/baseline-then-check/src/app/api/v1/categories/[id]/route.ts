import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/validations";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";

function errorResponse(
  code: string,
  message: string,
  details: unknown[] = [],
  status = 400
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

async function verifyAccess(categoryId: string, userId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      team: {
        include: {
          members: { where: { userId }, select: { role: true } },
        },
      },
    },
  });

  if (!category) return { category: null, canModify: false };

  if (category.userId === userId) return { category, canModify: true };

  const teamMember = category.team?.members[0];
  const canModify =
    teamMember?.role === "OWNER" || teamMember?.role === "MEMBER";

  return { category, canModify };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = readRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401);
  }

  const { id } = await params;
  const { category } = await verifyAccess(id, session.user.id);

  if (!category) {
    return errorResponse("NOT_FOUND", "Category not found", [], 404);
  }

  return NextResponse.json({ data: category });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = writeRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401);
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_REQUEST", "Invalid JSON body");
  }

  const parsed = updateCategorySchema.safeParse({ ...body, id });
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.issues);
  }

  const { category, canModify } = await verifyAccess(id, session.user.id);
  if (!category) return errorResponse("NOT_FOUND", "Category not found", [], 404);
  if (!canModify) return errorResponse("FORBIDDEN", "Insufficient permissions", [], 403);

  const { id: _id, ...data } = parsed.data;
  const updated = await prisma.category.update({ where: { id }, data });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = writeRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401);
  }

  const { id } = await params;
  const { category, canModify } = await verifyAccess(id, session.user.id);
  if (!category) return errorResponse("NOT_FOUND", "Category not found", [], 404);
  if (!canModify) return errorResponse("FORBIDDEN", "Insufficient permissions", [], 403);

  await prisma.category.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
