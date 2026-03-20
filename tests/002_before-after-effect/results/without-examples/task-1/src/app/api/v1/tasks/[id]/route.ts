import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validations/task";
import { checkRateLimit, getRateLimitHeaders, getClientIp } from "@/lib/security/rate-limiter";
import type { ApiError } from "@/lib/types";
import { TeamRole } from "@prisma/client";

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown[],
): NextResponse<ApiError> {
  return NextResponse.json(
    { error: { code, message, details: details ?? [] } },
    { status },
  );
}

function checkCsrfOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!origin) return true;
  return origin === appUrl;
}

const TASK_INCLUDE = {
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  category: { select: { id: true, name: true, color: true } },
} as const;

async function checkTaskAccess(
  taskId: string,
  userId: string,
  requireOwnership = false,
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: TASK_INCLUDE,
  });

  if (!task) return { task: null, hasAccess: false, isOwner: false };

  const isCreator = task.creatorId === userId;
  let isTeamOwner = false;

  if (task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: task.teamId } },
    });
    if (membership) {
      if (!requireOwnership) {
        return { task, hasAccess: true, isOwner: isCreator || membership.role === TeamRole.OWNER };
      }
      isTeamOwner = membership.role === TeamRole.OWNER;
    }
  }

  const isOwner = isCreator || isTeamOwner;

  if (requireOwnership) {
    return { task, hasAccess: isOwner, isOwner };
  }

  const hasAccess =
    task.creatorId === userId ||
    task.assigneeId === userId ||
    (task.teamId !== null && isTeamOwner !== undefined);

  return { task, hasAccess: hasAccess || isOwner, isOwner };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`read:${clientIp}`, "read");

  if (!rateLimitResult.success) {
    return errorResponse("RATE_LIMITED", "Too many requests", 429);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const userId = session.user.id;
  const { task, hasAccess } = await checkTaskAccess(id, userId);

  if (!task) return errorResponse("NOT_FOUND", "Task not found", 404);
  if (!hasAccess) return errorResponse("FORBIDDEN", "Access denied", 403);

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json(task, { headers });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");

  if (!rateLimitResult.success) {
    return errorResponse("RATE_LIMITED", "Too many requests", 429);
  }

  if (!checkCsrfOrigin(req)) {
    return errorResponse("FORBIDDEN", "Invalid origin", 403);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const userId = session.user.id;
  const { task, isOwner } = await checkTaskAccess(id, userId, true);

  if (!task) return errorResponse("NOT_FOUND", "Task not found", 404);
  if (!isOwner) return errorResponse("FORBIDDEN", "Only the task creator or team admin can edit this task", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid input", 400, parsed.error.issues);
  }

  const { updatedAt, ...data } = parsed.data;

  // Optimistic concurrency check
  if (updatedAt && task.updatedAt.getTime() !== updatedAt.getTime()) {
    return errorResponse("CONFLICT", "Task was modified by another request", 409);
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { userId: true, teamId: true },
    });
    if (!category) return errorResponse("NOT_FOUND", "Category not found", 404);

    const hasAccess =
      category.userId === userId ||
      (category.teamId &&
        (await prisma.teamMember.findUnique({
          where: { userId_teamId: { userId, teamId: category.teamId } },
        })));
    if (!hasAccess) return errorResponse("FORBIDDEN", "Access denied to category", 403);
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
    include: TASK_INCLUDE,
  });

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json(updated, { headers });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");

  if (!rateLimitResult.success) {
    return errorResponse("RATE_LIMITED", "Too many requests", 429);
  }

  if (!checkCsrfOrigin(req)) {
    return errorResponse("FORBIDDEN", "Invalid origin", 403);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const userId = session.user.id;
  const { task, isOwner } = await checkTaskAccess(id, userId, true);

  if (!task) return errorResponse("NOT_FOUND", "Task not found", 404);
  if (!isOwner) return errorResponse("FORBIDDEN", "Only the task creator or team admin can delete this task", 403);

  await prisma.task.delete({ where: { id } });

  const headers = getRateLimitHeaders(rateLimitResult);
  return new NextResponse(null, { status: 204, headers });
}
