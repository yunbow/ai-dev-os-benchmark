import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/features/tasks/schema/task-schema";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true, image: true } },
      creator: { select: { id: true, name: true, email: true, image: true } },
      team: { include: { members: { where: { userId: session.user.id } } } },
    },
  });

  if (!task) return errorResponse("NOT_FOUND", "Task not found", 404);

  const hasAccess =
    task.creatorId === session.user.id ||
    task.assigneeId === session.user.id ||
    (task.team?.members.length ?? 0) > 0;

  if (!hasAccess) return errorResponse("FORBIDDEN", "Access denied", 403);

  return NextResponse.json({ data: task });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: { team: { include: { members: true } } },
  });

  if (!task) return errorResponse("NOT_FOUND", "Task not found", 404);

  const isCreator = task.creatorId === session.user.id;
  const isTeamAdmin = task.team?.members.some(
    (m) => m.userId === session.user.id && m.role === "OWNER"
  );

  if (!isCreator && !isTeamAdmin) return errorResponse("FORBIDDEN", "Access denied", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : parsed.data.dueDate === null ? null : undefined,
    },
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: { team: { include: { members: true } } },
  });

  if (!task) return errorResponse("NOT_FOUND", "Task not found", 404);

  const isCreator = task.creatorId === session.user.id;
  const isTeamAdmin = task.team?.members.some(
    (m) => m.userId === session.user.id && m.role === "OWNER"
  );

  if (!isCreator && !isTeamAdmin) return errorResponse("FORBIDDEN", "Access denied", 403);

  await prisma.task.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
