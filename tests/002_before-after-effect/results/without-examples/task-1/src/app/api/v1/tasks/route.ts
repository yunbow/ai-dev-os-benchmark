import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, taskFiltersSchema } from "@/lib/validations/task";
import { checkRateLimit, getRateLimitHeaders, getClientIp } from "@/lib/security/rate-limiter";
import type { ApiError } from "@/lib/types";

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown[],
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? [],
      },
    },
    { status },
  );
}

function checkCsrfOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!origin) return true; // Same-origin requests may not have Origin header
  return origin === appUrl;
}

const TASK_INCLUDE = {
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  category: { select: { id: true, name: true, color: true } },
} as const;

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`read:${clientIp}`, "read");

  if (!rateLimitResult.success) {
    const headers = getRateLimitHeaders(rateLimitResult);
    return new NextResponse(
      JSON.stringify({
        error: { code: "RATE_LIMITED", message: "Too many requests", details: [] },
      }),
      { status: 429, headers: { "Content-Type": "application/json", ...headers } },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const userId = session.user.id;
  const { searchParams } = req.nextUrl;

  const params: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  const parsed = taskFiltersSchema.safeParse(params);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid query parameters",
      400,
      parsed.error.issues,
    );
  }

  const {
    status,
    priority,
    categoryId,
    assigneeId,
    search,
    teamId,
    cursor,
    sortField,
    sortOrder,
    limit,
  } = parsed.data;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!membership) {
      return errorResponse("FORBIDDEN", "You are not a member of this team", 403);
    }
    where.teamId = teamId;
  } else {
    where.OR = [{ creatorId: userId }, { assigneeId: userId }];
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (categoryId) where.categoryId = categoryId;
  if (assigneeId) where.assigneeId = assigneeId;

  if (search) {
    const searchCondition = {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    };
    if (where.OR) {
      where.AND = [{ OR: where.OR }, searchCondition];
      delete where.OR;
    } else {
      Object.assign(where, searchCondition);
    }
  }

  const orderBy =
    sortField === "priority"
      ? { priority: sortOrder }
      : { [sortField]: sortOrder };

  const tasks = await prisma.task.findMany({
    where,
    include: TASK_INCLUDE,
    orderBy,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = tasks.length > limit;
  const data = hasMore ? tasks.slice(0, limit) : tasks;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json(
    { data, nextCursor, hasMore },
    { headers: rateLimitHeaders },
  );
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");

  if (!rateLimitResult.success) {
    const headers = getRateLimitHeaders(rateLimitResult);
    return new NextResponse(
      JSON.stringify({
        error: { code: "RATE_LIMITED", message: "Too many requests", details: [] },
      }),
      { status: 429, headers: { "Content-Type": "application/json", ...headers } },
    );
  }

  // CSRF origin check
  if (!checkCsrfOrigin(req)) {
    return errorResponse("FORBIDDEN", "Invalid origin", 403);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid input",
      400,
      parsed.error.issues,
    );
  }

  const data = parsed.data;

  if (data.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: data.teamId } },
    });
    if (!membership) {
      return errorResponse("FORBIDDEN", "You are not a member of this team", 403);
    }
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { userId: true, teamId: true },
    });
    if (!category) {
      return errorResponse("NOT_FOUND", "Category not found", 404);
    }
    const hasAccess =
      category.userId === userId ||
      (category.teamId &&
        (await prisma.teamMember.findUnique({
          where: { userId_teamId: { userId, teamId: category.teamId } },
        })));
    if (!hasAccess) {
      return errorResponse("FORBIDDEN", "You do not have access to this category", 403);
    }
  }

  const task = await prisma.task.create({
    data: {
      ...data,
      creatorId: userId,
    },
    include: TASK_INCLUDE,
  });

  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json(task, { status: 201, headers: rateLimitHeaders });
}
