import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, taskFiltersSchema } from "@/validations/task";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiInternalError,
} from "@/lib/api-response";
import {
  readRateLimit,
  writeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { Priority } from "@prisma/client";

const priorityOrder: Record<Priority, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = readRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { searchParams } = req.nextUrl;
  const parsed = taskFiltersSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return apiValidationError(parsed.error);

  const { status, priority, categoryId, assigneeId, teamId, search, sortField, sortDirection, cursor, limit } = parsed.data;

  // Verify team access if teamId provided
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: session.user.id, teamId } },
    });
    if (!membership) return apiForbidden();
  }

  const where: Record<string, unknown> = {
    OR: teamId
      ? [{ teamId }]
      : [{ creatorId: session.user.id, teamId: null }, { assigneeId: session.user.id, teamId: null }],
    ...(status && { status }),
    ...(priority && { priority }),
    ...(categoryId && { categoryId }),
    ...(assigneeId && { assigneeId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  if (cursor) {
    (where as Record<string, unknown>).id = { gt: cursor };
  }

  try {
    const tasks = await prisma.task.findMany({
      where,
      take: limit + 1,
      orderBy:
        sortField === "priority"
          ? { priority: sortDirection }
          : { [sortField]: sortDirection },
      select: {
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
        creator: { select: { id: true, name: true, email: true, image: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    });

    const hasMore = tasks.length > limit;
    const data = hasMore ? tasks.slice(0, limit) : tasks;
    const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

    return apiSuccess({ data, nextCursor, hasMore });
  } catch {
    return apiInternalError();
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = writeRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const { teamId, assigneeId, categoryId, ...rest } = parsed.data;

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: session.user.id, teamId } },
    });
    if (!membership || membership.role === "VIEWER") return apiForbidden();
  }

  try {
    const task = await prisma.task.create({
      data: {
        ...rest,
        creatorId: session.user.id,
        teamId: teamId ?? null,
        assigneeId: assigneeId ?? null,
        categoryId: categoryId ?? null,
      },
      select: {
        id: true, title: true, description: true, status: true, priority: true,
        dueDate: true, createdAt: true, updatedAt: true, creatorId: true,
        assigneeId: true, categoryId: true, teamId: true,
        creator: { select: { id: true, name: true, email: true, image: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    });
    return apiSuccess(task, 201);
  } catch {
    return apiInternalError();
  }
}
