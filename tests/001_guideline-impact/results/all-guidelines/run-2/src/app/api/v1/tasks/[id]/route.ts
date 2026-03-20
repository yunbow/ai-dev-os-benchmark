import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, setRateLimitHeaders } from "@/lib/api/rate-limit";
import { CreateTaskSchema } from "@/features/tasks/schema/task-schema";
import { ZodError } from "zod";

const TASK_INCLUDE = {
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  category: { select: { id: true, name: true, color: true } },
};

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message, details: [] } }, { status });
}

async function checkTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { team: { include: { members: { where: { userId } } } } },
  });
  if (!task) return { task: null, canRead: false, canWrite: false };
  const isCreator = task.creatorId === userId;
  const member = task.team?.members[0];
  const canRead = isCreator || !!member;
  const canWrite = isCreator || (member && (member.role === "OWNER" || member.role === "MEMBER"));
  return { task, canRead, canWrite: !!canWrite };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getClientIp(req);
  const rl = checkRateLimit(`read:${ip}`, "read");
  const headers = new Headers();
  setRateLimitHeaders(headers, rl);
  if (!rl.allowed) return NextResponse.json({ error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests", details: [] } }, { status: 429, headers });

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { task, canRead } = await checkTaskAccess(id, session.user.id);
  if (!task) return errorResponse("NOT_FOUND", "Task not found", 404);
  if (!canRead) return errorResponse("FORBIDDEN", "Access denied", 403);

  const fullTask = await prisma.task.findUnique({ where: { id }, include: TASK_INCLUDE });
  return NextResponse.json(fullTask, { headers });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getClientIp(req);
  const rl = checkRateLimit(`write:${ip}`, "write");
  const headers = new Headers();
  setRateLimitHeaders(headers, rl);
  if (!rl.allowed) return NextResponse.json({ error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests", details: [] } }, { status: 429, headers });

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { task, canWrite } = await checkTaskAccess(id, session.user.id);
  if (!task) return errorResponse("NOT_FOUND", "Task not found", 404);
  if (!canWrite) return errorResponse("FORBIDDEN", "Access denied", 403);

  try {
    const body = await req.json();
    const validated = CreateTaskSchema.partial().parse(body);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : validated.dueDate === null ? null : undefined,
      },
      include: TASK_INCLUDE,
    });

    return NextResponse.json(updated, { headers });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
    }
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = getClientIp(req);
  const rl = checkRateLimit(`write:${ip}`, "write");
  const headers = new Headers();
  setRateLimitHeaders(headers, rl);
  if (!rl.allowed) return NextResponse.json({ error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests", details: [] } }, { status: 429, headers });

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { task } = await checkTaskAccess(id, session.user.id);
  if (!task) return errorResponse("NOT_FOUND", "Task not found", 404);
  if (task.creatorId !== session.user.id) return errorResponse("FORBIDDEN", "Only the task creator can delete it", 403);

  await prisma.task.delete({ where: { id } });
  return new NextResponse(null, { status: 204, headers });
}
