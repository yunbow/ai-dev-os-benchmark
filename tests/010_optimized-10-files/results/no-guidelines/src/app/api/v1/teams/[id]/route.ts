import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamSchema } from "@/lib/validations";

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

  const team = await db.team.findFirst({
    where: {
      id,
      members: { some: { userId } },
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: {
        select: { tasks: true },
      },
    },
  });

  if (!team) {
    return errorResponse("NOT_FOUND", "Team not found.", 404);
  }

  return NextResponse.json({ data: team });
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

  // Only owner can update team
  const team = await db.team.findFirst({
    where: { id, ownerId: userId },
  });

  if (!team) {
    return errorResponse(
      "NOT_FOUND",
      "Team not found or you do not have permission to update it.",
      404
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON in request body.", 400);
  }

  const parsed = teamSchema.partial().safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid team data.",
      400,
      parsed.error.issues
    );
  }

  const updated = await db.team.update({
    where: { id },
    data: parsed.data,
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      _count: {
        select: { members: true, tasks: true },
      },
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

  // Only owner can delete team
  const team = await db.team.findFirst({
    where: { id, ownerId: userId },
  });

  if (!team) {
    return errorResponse(
      "NOT_FOUND",
      "Team not found or you do not have permission to delete it.",
      404
    );
  }

  await db.team.delete({ where: { id } });

  return NextResponse.json({ data: { id } });
}
