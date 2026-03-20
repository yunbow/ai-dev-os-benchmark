import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { UpdateTaskSchema } from "@/features/tasks/schema/task-schema";
import { TeamRole } from "@prisma/client";
import type { NextRequest } from "next/server";

function errorResponse(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

const TASK_INCLUDE = {
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  category: { select: { id: true, name: true, color: true } },
  team: { select: { id: true, name: true } },
};

export const dynamic = "force-dynamic";

async function getTaskWithAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: TASK_INCLUDE,
  });

  if (!task) return { task: null, error: errorResponse("NOT_FOUND", "Task not found", 404) };

  if (task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: task.teamId, userId } },
    });
    if (!membership) return { task: null, error: errorResponse("FORBIDDEN", "Access denied", 403) };
  } else if (task.creatorId !== userId) {
    return { task: null, error: errorResponse("FORBIDDEN", "Access denied", 403) };
  }

  return { task, error: null };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  const { task, error } = await getTaskWithAccess(id, session.user.id);
  if (error) return error;

  return Response.json(task);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { success: rateLimitOk } = await checkRateLimit(`write:${session.user.id}`, RATE_LIMITS.write);
  if (!rateLimitOk) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests", 429);

  const { id } = await params;
  const { task, error } = await getTaskWithAccess(id, session.user.id);
  if (error) return error;

  // Check write permissions
  if (task!.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: task!.teamId, userId: session.user.id } },
    });
    const isCreator = task!.creatorId === session.user.id;
    const isAdmin = membership?.role === TeamRole.OWNER;
    if (!isCreator && !isAdmin) return errorResponse("FORBIDDEN", "Only the creator or team admin can modify this task", 403);
  } else if (task!.creatorId !== session.user.id) {
    return errorResponse("FORBIDDEN", "Only the task creator can modify it", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);
  }

  const parsed = UpdateTaskSchema.partial().safeParse({ ...body, id });
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const { dueDate, ...rest } = parsed.data;
  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
    },
    include: TASK_INCLUDE,
  });

  return Response.json(updatedTask);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { success: rateLimitOk } = await checkRateLimit(`write:${session.user.id}`, RATE_LIMITS.write);
  if (!rateLimitOk) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests", 429);

  const { id } = await params;
  const { task, error } = await getTaskWithAccess(id, session.user.id);
  if (error) return error;

  if (task!.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: task!.teamId, userId: session.user.id } },
    });
    const isCreator = task!.creatorId === session.user.id;
    const isAdmin = membership?.role === TeamRole.OWNER;
    if (!isCreator && !isAdmin) return errorResponse("FORBIDDEN", "Only the creator or team admin can delete this task", 403);
  } else if (task!.creatorId !== session.user.id) {
    return errorResponse("FORBIDDEN", "Only the task creator can delete it", 403);
  }

  await prisma.task.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
