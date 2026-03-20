import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validations";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";
import { TaskStatus, TaskPriority } from "@prisma/client";

function errorResponse(
  code: string,
  message: string,
  details: unknown[] = [],
  status = 400
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

async function verifyAccess(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { creatorId: userId },
        { assigneeId: userId },
        { team: { members: { some: { userId } } } },
      ],
    },
    include: {
      team: { include: { members: { where: { userId }, select: { role: true } } } },
    },
  });

  if (!task) return { task: null, canModify: false };

  const isCreator = task.creatorId === userId;
  const teamMember = task.team?.members[0];
  const canModify =
    isCreator ||
    teamMember?.role === "OWNER" ||
    teamMember?.role === "MEMBER";

  return { task, canModify };
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
  const task = await prisma.task.findFirst({
    where: {
      id,
      OR: [
        { creatorId: session.user.id },
        { assigneeId: session.user.id },
        { team: { members: { some: { userId: session.user.id } } } },
      ],
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, color: true } },
      team: { select: { id: true, name: true } },
    },
  });

  if (!task) {
    return errorResponse("NOT_FOUND", "Task not found", [], 404);
  }

  return NextResponse.json({ data: task });
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

  const parsed = updateTaskSchema.safeParse({ ...body, id });
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.issues);
  }

  const { task, canModify } = await verifyAccess(id, session.user.id);
  if (!task) return errorResponse("NOT_FOUND", "Task not found", [], 404);
  if (!canModify) return errorResponse("FORBIDDEN", "Insufficient permissions", [], 403);

  const { id: _id, updatedAt, ...data } = parsed.data;

  if (updatedAt && task.updatedAt.toISOString() !== updatedAt) {
    return errorResponse(
      "CONFLICT",
      "Task was modified by another user",
      [],
      409
    );
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      status: data.status as TaskStatus | undefined,
      priority: data.priority as TaskPriority | undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
      categoryId: data.categoryId || null,
      assigneeId: data.assigneeId || null,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, color: true } },
      team: { select: { id: true, name: true } },
    },
  });

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
  const { task, canModify } = await verifyAccess(id, session.user.id);
  if (!task) return errorResponse("NOT_FOUND", "Task not found", [], 404);
  if (!canModify) return errorResponse("FORBIDDEN", "Insufficient permissions", [], 403);

  await prisma.task.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
