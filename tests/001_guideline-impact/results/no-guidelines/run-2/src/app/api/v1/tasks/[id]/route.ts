import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/validations/task";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiInternalError,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const taskSelect = {
  id: true, title: true, description: true, status: true, priority: true,
  dueDate: true, createdAt: true, updatedAt: true, creatorId: true,
  assigneeId: true, categoryId: true, teamId: true,
  creator: { select: { id: true, name: true, email: true, image: true } },
  assignee: { select: { id: true, name: true, email: true, image: true } },
  category: { select: { id: true, name: true, color: true } },
} as const;

async function getTaskAndVerifyAccess(
  taskId: string,
  userId: string,
  requireWrite = false
): Promise<{ task: Awaited<ReturnType<typeof prisma.task.findUnique>>; error?: string }> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { task: null, error: "not_found" };

  if (task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: task.teamId } },
    });
    if (!membership) return { task: null, error: "forbidden" };
    if (requireWrite && membership.role === "VIEWER") return { task: null, error: "forbidden" };
    if (requireWrite && membership.role === "MEMBER" && task.creatorId !== userId) {
      return { task: null, error: "forbidden" };
    }
  } else {
    if (task.creatorId !== userId && task.assigneeId !== userId) {
      return { task: null, error: "forbidden" };
    }
    if (requireWrite && task.creatorId !== userId) {
      return { task: null, error: "forbidden" };
    }
  }

  return { task };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = readRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;
  const { task, error } = await getTaskAndVerifyAccess(id, session.user.id);

  if (error === "not_found") return apiNotFound("Task");
  if (error === "forbidden") return apiForbidden();

  const fullTask = await prisma.task.findUnique({ where: { id }, select: taskSelect });
  return apiSuccess(fullTask);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = writeRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;
  const { task, error } = await getTaskAndVerifyAccess(id, session.user.id, true);

  if (error === "not_found") return apiNotFound("Task");
  if (error === "forbidden") return apiForbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    const updated = await prisma.task.update({
      where: { id },
      data: parsed.data,
      select: taskSelect,
    });
    return apiSuccess(updated);
  } catch {
    return apiInternalError();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = writeRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;
  const { task, error } = await getTaskAndVerifyAccess(id, session.user.id, true);

  if (error === "not_found") return apiNotFound("Task");
  if (error === "forbidden") return apiForbidden();

  // Only creator or team owner can delete
  if (task && task.creatorId !== session.user.id) {
    if (task.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: session.user.id, teamId: task.teamId } },
      });
      if (membership?.role !== "OWNER") return apiForbidden();
    } else {
      return apiForbidden();
    }
  }

  try {
    await prisma.task.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return apiInternalError();
  }
}
