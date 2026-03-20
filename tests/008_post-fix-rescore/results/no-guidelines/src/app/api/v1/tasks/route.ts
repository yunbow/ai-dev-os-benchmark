import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTaskSchema, taskFiltersSchema } from "@/lib/validations/task";
import {
  apiSuccess,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
  apiInternalError,
  apiPaginated,
} from "@/lib/api-response";
import {
  writeRateLimiter,
  readRateLimiter,
  getIdentifier,
  rateLimitResponse,
} from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";

const TASKS_PER_PAGE = 20;

export async function GET(request: NextRequest) {
  // Rate limiting
  const identifier = getIdentifier(request, "tasks:read");
  const rateLimitResult = readRateLimiter.check(identifier);
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult.resetTime);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return apiUnauthorized();
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawFilters = Object.fromEntries(searchParams.entries());

    const parsed = taskFiltersSchema.safeParse(rawFilters);
    if (!parsed.success) {
      return apiBadRequest("Invalid query parameters");
    }

    const { status, priority, categoryId, assigneeId, teamId, search, cursor, sortBy, sortOrder } =
      parsed.data;

    const where: Prisma.TaskWhereInput = {
      AND: [
        teamId
          ? {
              team: {
                members: { some: { userId: session.user.id } },
              },
              teamId,
            }
          : { creatorId: session.user.id, teamId: null },
        status ? { status } : {},
        priority ? { priority } : {},
        categoryId ? { categoryId } : {},
        assigneeId ? { assigneeId } : {},
        search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        cursor ? { id: { lt: cursor } } : {},
      ],
    };

    const orderBy: Prisma.TaskOrderByWithRelationInput =
      sortBy === "priority"
        ? { priority: sortOrder }
        : sortBy === "dueDate"
        ? { dueDate: sortOrder }
        : { createdAt: sortOrder };

    const tasks = await db.task.findMany({
      where,
      orderBy,
      take: TASKS_PER_PAGE + 1,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        categoryId: true,
        assigneeId: true,
        creatorId: true,
        teamId: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    const hasMore = tasks.length > TASKS_PER_PAGE;
    const paginatedTasks = hasMore ? tasks.slice(0, TASKS_PER_PAGE) : tasks;
    const nextCursor =
      hasMore ? paginatedTasks[paginatedTasks.length - 1].id : null;

    return apiPaginated(paginatedTasks, nextCursor, hasMore);
  } catch (error) {
    console.error("GET /api/v1/tasks error:", error);
    return apiInternalError();
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier = getIdentifier(request, "tasks:write");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult.resetTime);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return apiUnauthorized();
  }

  try {
    const body = await request.json();

    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return apiBadRequest("Validation failed", details);
    }

    const { teamId, categoryId, assigneeId, dueDate, ...rest } = parsed.data;

    // Verify team membership
    if (teamId) {
      const membership = await db.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: session.user.id } },
      });
      if (!membership) {
        return apiForbidden("You are not a member of this team");
      }
      if (membership.role === "VIEWER") {
        return apiForbidden("Viewers cannot create tasks");
      }
    }

    const task = await db.task.create({
      data: {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
        categoryId: categoryId ?? null,
        assigneeId: assigneeId ?? null,
        teamId: teamId ?? null,
        creatorId: session.user.id,
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return apiSuccess(task, 201);
  } catch (error) {
    console.error("POST /api/v1/tasks error:", error);
    return apiInternalError();
  }
}
