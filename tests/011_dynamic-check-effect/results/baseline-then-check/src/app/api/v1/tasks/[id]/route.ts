import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { updateTaskSchema } from "@/lib/validations/task";
import {
  apiSuccess,
  zodErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  rateLimitResponse,
  invalidBodyResponse,
} from "@/lib/api-response";

async function getTaskWithPermission(taskId: string, userId: string, write = false) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      category: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      team: { include: { members: { where: { userId } } } },
    },
  });

  if (!task) return { task: null, allowed: false };

  // Check read access
  const isCreator = task.creatorId === userId;
  const isAssignee = task.assigneeId === userId;
  const teamMember = task.team?.members[0];
  const isTeamMember = !!teamMember;

  if (!isCreator && !isAssignee && !isTeamMember) {
    return { task, allowed: false };
  }

  if (write) {
    const canWrite =
      isCreator ||
      (teamMember && (teamMember.role === "OWNER" || teamMember.role === "MEMBER"));
    return { task, allowed: !!canWrite };
  }

  return { task, allowed: true };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`read:${ip}`, RATE_LIMITS.read.limit, RATE_LIMITS.read.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const { task, allowed } = await getTaskWithPermission(id, session.user.id);

  if (!task) return notFoundResponse("Task");
  if (!allowed) return forbiddenResponse();

  return apiSuccess(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`write:${ip}`, RATE_LIMITS.write.limit, RATE_LIMITS.write.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const { task, allowed } = await getTaskWithPermission(id, session.user.id, true);

  if (!task) return notFoundResponse("Task");
  if (!allowed) return forbiddenResponse();

  const body = await req.json().catch(() => null);
  if (!body) return invalidBodyResponse();

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { updatedAt: clientUpdatedAt, ...updateData } = parsed.data;

  if (clientUpdatedAt && task.updatedAt.getTime() !== clientUpdatedAt.getTime()) {
    return zodErrorResponse({
      errors: [{ path: ["updatedAt"], message: "Concurrent edit detected", code: "custom" }],
    });
  }

  const updated = await db.task.update({
    where: { id },
    data: updateData,
    include: {
      category: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  return apiSuccess(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`write:${ip}`, RATE_LIMITS.write.limit, RATE_LIMITS.write.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const { task, allowed } = await getTaskWithPermission(id, session.user.id, true);

  if (!task) return notFoundResponse("Task");
  if (!allowed) return forbiddenResponse();

  await db.task.delete({ where: { id } });
  return apiSuccess({ message: "Task deleted" });
}
