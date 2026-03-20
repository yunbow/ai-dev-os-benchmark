import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateTaskSchema } from "@/lib/validations";

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

async function checkTaskPermission(
  taskId: string,
  userId: string,
  requireWrite = false
) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      team: {
        include: {
          members: {
            where: { userId },
            select: { role: true },
          },
        },
      },
    },
  });

  if (!task) return { task: null, hasAccess: false, canWrite: false };

  const teamMember = task.team?.members[0];
  const isCreator = task.creatorId === userId;
  const isAssignee = task.assigneeId === userId;
  const isTeamMember = !!teamMember;
  const isTeamAdmin =
    teamMember?.role === "OWNER" || teamMember?.role === "MEMBER";

  const hasAccess = isCreator || isAssignee || isTeamMember;
  const canWrite = isCreator || isTeamAdmin;

  if (requireWrite && !canWrite) return { task, hasAccess, canWrite: false };
  if (!requireWrite && !hasAccess) return { task, hasAccess: false, canWrite };

  return { task, hasAccess, canWrite };
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

  const { task, hasAccess } = await checkTaskPermission(id, userId);

  if (!task) {
    return errorResponse("NOT_FOUND", "Task not found.", 404);
  }

  if (!hasAccess) {
    return errorResponse("FORBIDDEN", "You do not have access to this task.", 403);
  }

  const fullTask = await db.task.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, name: true, color: true },
      },
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      creator: {
        select: { id: true, name: true, email: true, image: true },
      },
      team: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json({ data: fullTask });
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

  const { task, canWrite } = await checkTaskPermission(id, userId, true);

  if (!task) {
    return errorResponse("NOT_FOUND", "Task not found.", 404);
  }

  if (!canWrite) {
    return errorResponse(
      "FORBIDDEN",
      "You do not have permission to update this task.",
      403
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON in request body.", 400);
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid task data.",
      400,
      parsed.error.issues
    );
  }

  const { updatedAt, ...updateData } = parsed.data;

  // Optimistic concurrency check
  if (updatedAt) {
    const clientUpdatedAt = new Date(updatedAt);
    if (task.updatedAt.getTime() !== clientUpdatedAt.getTime()) {
      return errorResponse(
        "CONFLICT",
        "Task was modified by another user. Please refresh and try again.",
        409
      );
    }
  }

  const updatedTask = await db.task.update({
    where: { id },
    data: updateData,
    include: {
      category: {
        select: { id: true, name: true, color: true },
      },
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      creator: {
        select: { id: true, name: true, email: true, image: true },
      },
      team: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json({ data: updatedTask });
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

  const { task, canWrite } = await checkTaskPermission(id, userId, true);

  if (!task) {
    return errorResponse("NOT_FOUND", "Task not found.", 404);
  }

  if (!canWrite) {
    return errorResponse(
      "FORBIDDEN",
      "You do not have permission to delete this task.",
      403
    );
  }

  await db.task.delete({ where: { id } });

  return NextResponse.json({ data: { id } });
}
