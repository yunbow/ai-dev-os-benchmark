import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, taskFilterSchema } from "@/lib/validations/task";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  rateLimitResponse,
  internalErrorResponse,
  forbiddenResponse,
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

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = readRateLimit.check(`read:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { searchParams } = new URL(request.url);
  const parsed = taskFilterSchema.safeParse({
    status: searchParams.get("status"),
    priority: searchParams.get("priority"),
    categoryId: searchParams.get("categoryId"),
    assigneeId: searchParams.get("assigneeId"),
    teamId: searchParams.get("teamId"),
    search: searchParams.get("search"),
    sortBy: searchParams.get("sortBy") ?? "createdAt",
    sortOrder: searchParams.get("sortOrder") ?? "desc",
    cursor: searchParams.get("cursor"),
    limit: searchParams.get("limit") ?? "20",
  });

  if (!parsed.success) return validationErrorResponse(parsed.error);

  const filters = parsed.data;
  const userId = session.user.id;

  const where: Record<string, unknown> = {
    OR: [{ creatorId: userId }, { assigneeId: userId }],
  };

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.teamId) where.teamId = filters.teamId;

  if (filters.search) {
    const search = filters.search;
    where.AND = [
      {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  let orderBy: Record<string, string> = { createdAt: filters.sortOrder };
  if (filters.sortBy === "dueDate") orderBy = { dueDate: filters.sortOrder };
  else if (filters.sortBy === "priority") orderBy = { priority: filters.sortOrder };

  const limit = filters.limit + 1;

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
    take: limit,
    cursor: filters.cursor ? { id: filters.cursor } : undefined,
    skip: filters.cursor ? 1 : 0,
    select: taskSelect,
  });

  const hasMore = tasks.length > filters.limit;
  const items = hasMore ? tasks.slice(0, -1) : tasks;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return paginatedResponse(items, nextCursor, hasMore);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = writeRateLimit.check(`write:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  const { teamId, categoryId, assigneeId, ...taskData } = parsed.data;
  const userId = session.user.id;

  // Verify team membership if teamId provided
  if (teamId) {
    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
    if (!team) return errorResponse("NOT_FOUND", "Team not found", 404);

    let hasAccess = team.ownerId === userId;
    if (!hasAccess) {
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId } },
        select: { role: true },
      });
      hasAccess = member !== null && member.role !== TeamRole.VIEWER;
    }
    if (!hasAccess) return forbiddenResponse();
  }

  try {
    const task = await prisma.task.create({
      data: {
        ...taskData,
        creatorId: userId,
        teamId: teamId ?? null,
        categoryId: categoryId ?? null,
        assigneeId: assigneeId ?? null,
      },
      select: taskSelect,
    });

    return successResponse(task, 201);
  } catch {
    return internalErrorResponse();
  }
}
