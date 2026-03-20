import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RateLimitPresets, getClientIp } from "@/lib/rate-limit";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiRateLimited,
  apiInternalError,
  withRateLimitHeaders,
} from "@/lib/api-response";
import { decodeCursor, encodeCursor } from "@/lib/action-helpers";
import { requireTeamRole } from "@/lib/permissions";
import { TaskCreateSchema, TaskFilterSchema } from "@/features/tasks/schemas";
import { listTasks, taskInclude } from "@/features/tasks/queries";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    // Rate limit
    const rateLimitResult = checkRateLimit(
      `user:${session.user.id}`,
      RateLimitPresets.read
    );
    if (!rateLimitResult.allowed) {
      return apiRateLimited(rateLimitResult.retryAfter);
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const rawFilters = {
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      assigneeId: searchParams.get("assigneeId") ?? undefined,
      teamId: searchParams.get("teamId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    };

    const parsed = TaskFilterSchema.safeParse(rawFilters);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return apiValidationError(fieldErrors);
    }

    const filters = parsed.data;

    // Verify team access
    if (filters.teamId) {
      const membership = await requireTeamRole(filters.teamId, session.user.id, "VIEWER");
      if (!("member" in membership)) {
        return apiError(membership.error.code, membership.error.message, 403);
      }
    }

    const result = await listTasks(session.user.id, filters);

    const response = apiSuccess({
      data: result.data,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });

    return withRateLimitHeaders(
      response,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[GET /api/v1/tasks]", error);
    return apiInternalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    // Rate limit writes
    const rateLimitResult = checkRateLimit(
      `user:${session.user.id}`,
      RateLimitPresets.write
    );
    if (!rateLimitResult.allowed) {
      return apiRateLimited(rateLimitResult.retryAfter);
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return apiError("INVALID_JSON", "Request body must be valid JSON", 400);
    }

    const parsed = TaskCreateSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return apiValidationError(fieldErrors);
    }

    const data = parsed.data;

    // Verify team membership for team tasks
    if (data.teamId) {
      const membership = await requireTeamRole(data.teamId, session.user.id, "MEMBER");
      if (!("member" in membership)) {
        return apiError(membership.error.code, membership.error.message, 403);
      }
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate,
        categoryId: data.categoryId,
        assigneeId: data.assigneeId,
        teamId: data.teamId,
        userId: session.user.id,
      },
      include: taskInclude,
    });

    const response = apiSuccess(task, 201);
    return withRateLimitHeaders(
      response,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[POST /api/v1/tasks]", error);
    return apiInternalError();
  }
}
