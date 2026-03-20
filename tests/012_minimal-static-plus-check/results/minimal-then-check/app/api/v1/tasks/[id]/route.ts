import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RateLimits } from "@/lib/api/rate-limit";
import { updateTaskSchema } from "@/features/tasks/schema";
import { getTask, updateTask, deleteTask } from "@/features/tasks/services/task-service";
import { prisma } from "@/lib/prisma/client";
import { TeamRole } from "@prisma/client";

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for") ?? "unknown";
}

async function verifyTaskAccess(taskId: string, userId: string, mutating = false) {
  const task = await getTask(taskId);
  if (!task) return { task: null, allowed: false };

  if (task.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: task.teamId, userId } },
    });
    if (!member) return { task, allowed: false };
    if (mutating) {
      const isCreator = task.creatorId === userId;
      const isAdmin = member.role === TeamRole.OWNER;
      if (!isCreator && !isAdmin) return { task, allowed: false };
    }
    return { task, allowed: true };
  }

  if (task.creatorId !== userId && task.assigneeId !== userId) {
    return { task, allowed: false };
  }
  if (mutating && task.creatorId !== userId) {
    return { task, allowed: false };
  }
  return { task, allowed: true };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getIp(req);
  const { success: ok } = checkRateLimit(`api:read:${ip}`, RateLimits.read);
  if (!ok) return apiError("RATE_LIMITED", "Too many requests", [], 429);

  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "Unauthorized", [], 401);

  const { id } = await params;
  const { task, allowed } = await verifyTaskAccess(id, session.user.id);
  if (!task) return apiError("NOT_FOUND", "Task not found", [], 404);
  if (!allowed) return apiError("FORBIDDEN", "Forbidden", [], 403);

  return apiSuccess(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getIp(req);
  const { success: ok } = checkRateLimit(`api:write:${ip}`, RateLimits.write);
  if (!ok) return apiError("RATE_LIMITED", "Too many requests", [], 429);

  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "Unauthorized", [], 401);

  const { id } = await params;
  const { task, allowed } = await verifyTaskAccess(id, session.user.id, true);
  if (!task) return apiError("NOT_FOUND", "Task not found", [], 404);
  if (!allowed) return apiError("FORBIDDEN", "Forbidden", [], 403);

  const body = await req.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  const updated = await updateTask(id, parsed.data);
  return apiSuccess(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getIp(req);
  const { success: ok } = checkRateLimit(`api:write:${ip}`, RateLimits.write);
  if (!ok) return apiError("RATE_LIMITED", "Too many requests", [], 429);

  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "Unauthorized", [], 401);

  const { id } = await params;
  const { task, allowed } = await verifyTaskAccess(id, session.user.id, true);
  if (!task) return apiError("NOT_FOUND", "Task not found", [], 404);
  if (!allowed) return apiError("FORBIDDEN", "Forbidden", [], 403);

  await deleteTask(id);
  return apiSuccess(null, 204);
}
