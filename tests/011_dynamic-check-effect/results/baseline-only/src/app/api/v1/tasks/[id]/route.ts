import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validations/task";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  rateLimitResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { TeamRole } from "@prisma/client";

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  creatorId: true,
  assigneeId: true,
  categoryId: true,
  teamId: true,
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  category: { select: { id: true, name: true, color: true } },
  team: { select: { id: true, name: true } },
} as const;

async function getTaskAndCheckAccess(
  taskId: string,
  userId: string,
  requireEdit = false
): Promise<{ task: Awaited<ReturnType<typeof prisma.task.findUnique>>; canEdit: boolean } | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { ...taskSelect, creatorId: true, teamId: true, assigneeId: true },
  });

  if (!task) return null;

  let hasAccess =
    task.creatorId === userId || task.assigneeId === userId;

  if (!hasAccess && task.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: task.teamId } },
    });
    hasAccess = member !== null;
  }

  if (!hasAccess) return null;

  let canEdit = task.creatorId === userId;
  if (!canEdit && task.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: task.teamId },
      select: { ownerId: true },
    });
    canEdit = team?.ownerId === userId;
  }

  if (requireEdit && !canEdit) return null;

  return { task, canEdit };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = readRateLimit.check(`read:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const result = await getTaskAndCheckAccess(id, session.user.id);

  if (!result) return notFoundResponse("Task");

  return successResponse(result.task);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = writeRateLimit.check(`write:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const existing = await prisma.task.findUnique({
    where: { id },
    select: { creatorId: true, teamId: true, updatedAt: true },
  });

  if (!existing) return notFoundResponse("Task");

  let canEdit = existing.creatorId === session.user.id;
  if (!canEdit && existing.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: existing.teamId },
      select: { ownerId: true },
    });
    canEdit = team?.ownerId === session.user.id;
  }

  if (!canEdit) return forbiddenResponse();

  if (parsed.data.updatedAt && existing.updatedAt > parsed.data.updatedAt) {
    return errorResponse(
      "CONFLICT",
      "Task was modified by another user. Please refresh.",
      409
    );
  }

  const { updatedAt, ...updateData } = parsed.data;

  try {
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      select: taskSelect,
    });
    return successResponse(task);
  } catch {
    return internalErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = writeRateLimit.check(`write:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;

  const existing = await prisma.task.findUnique({
    where: { id },
    select: { creatorId: true, teamId: true },
  });

  if (!existing) return notFoundResponse("Task");

  let canDelete = existing.creatorId === session.user.id;
  if (!canDelete && existing.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: existing.teamId },
      select: { ownerId: true },
    });
    canDelete = team?.ownerId === session.user.id;
  }

  if (!canDelete) return forbiddenResponse();

  await prisma.task.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
