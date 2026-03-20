import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validations";

function errorResponse(
  code: string,
  message: string,
  status: number,
  details: unknown[] = []
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

async function findCategoryWithAccess(id: string, userId: string) {
  return db.category.findFirst({
    where: {
      id,
      OR: [
        { userId },
        {
          team: {
            members: {
              some: { userId },
            },
          },
        },
      ],
    },
    include: {
      team: {
        include: {
          members: {
            where: { userId },
            select: { role: true },
          },
        },
      },
      _count: { select: { tasks: true } },
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  const { id } = await params;
  const userId = session.user.id;

  const category = await findCategoryWithAccess(id, userId);

  if (!category) {
    return errorResponse("NOT_FOUND", "Category not found.", 404);
  }

  return NextResponse.json({ data: category });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  const { id } = await params;
  const userId = session.user.id;

  const category = await findCategoryWithAccess(id, userId);

  if (!category) {
    return errorResponse("NOT_FOUND", "Category not found.", 404);
  }

  // Check write permission
  const isOwner = category.userId === userId;
  const teamMember = category.team?.members[0];
  const canWrite =
    isOwner ||
    teamMember?.role === "OWNER" ||
    teamMember?.role === "MEMBER";

  if (!canWrite) {
    return errorResponse(
      "FORBIDDEN",
      "You do not have permission to update this category.",
      403
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON in request body.", 400);
  }

  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid category data.",
      400,
      parsed.error.issues
    );
  }

  const { teamId: _teamId, ...updateData } = parsed.data;

  const updated = await db.category.update({
    where: { id },
    data: updateData,
    include: {
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  const { id } = await params;
  const userId = session.user.id;

  const category = await findCategoryWithAccess(id, userId);

  if (!category) {
    return errorResponse("NOT_FOUND", "Category not found.", 404);
  }

  // Check write permission
  const isOwner = category.userId === userId;
  const teamMember = category.team?.members[0];
  const canWrite =
    isOwner || teamMember?.role === "OWNER";

  if (!canWrite) {
    return errorResponse(
      "FORBIDDEN",
      "You do not have permission to delete this category.",
      403
    );
  }

  await db.category.delete({ where: { id } });

  return NextResponse.json({ data: { id } });
}
