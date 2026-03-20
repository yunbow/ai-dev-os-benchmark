import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { CreateTaskSchema, TaskFilterSchema } from "@/features/tasks/schema/task-schema";
import { ActionErrors } from "@/lib/actions/errors";

const taskInclude = {
  category: true,
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
  team: { select: { id: true, name: true } },
};

function errorResponse(error: ReturnType<typeof ActionErrors.unauthorized>, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ error }, { status, headers });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(ActionErrors.unauthorized(), 401);
  }

  const rl = rateLimit(`api:read:${session.user.id}`, 100, 60000);
  if (!rl.success) {
    return errorResponse(ActionErrors.rateLimited(), 429, rateLimitHeaders(rl));
  }

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());

  const parsed = TaskFilterSchema.safeParse({
    ...params,
    pageSize: params.pageSize ? parseInt(params.pageSize) : 20,
  });

  if (!parsed.success) {
    return errorResponse(
      { code: "VALIDATION_ERROR", message: "Invalid query parameters" },
      400
    );
  }

  const { cursor, pageSize, search, ...filters } = parsed.data;
  const take = pageSize + 1;

  const where = {
    OR: [
      { creatorId: session.user.id },
      { assigneeId: session.user.id },
    ],
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.teamId && { teamId: filters.teamId }),
    ...(search && {
      AND: [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        },
      ],
    }),
  };

  const tasks = await prisma.task.findMany({
    where,
    take,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    include: taskInclude,
  });

  const hasMore = tasks.length > pageSize;
  const data = hasMore ? tasks.slice(0, pageSize) : tasks;
  const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

  return NextResponse.json(
    { data, nextCursor, hasMore },
    { headers: rateLimitHeaders(rl) }
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(ActionErrors.unauthorized(), 401);
  }

  const rl = rateLimit(`api:write:${session.user.id}`, 30, 60000);
  if (!rl.success) {
    return errorResponse(ActionErrors.rateLimited(), 429, rateLimitHeaders(rl));
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return errorResponse(ActionErrors.badRequest("Invalid JSON body"), 400);
  }

  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 422 }
    );
  }

  const { dueDate, ...rest } = parsed.data;

  const task = await prisma.task.create({
    data: {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
      creatorId: session.user.id,
    },
    include: taskInclude,
  });

  return NextResponse.json({ data: task }, { status: 201, headers: rateLimitHeaders(rl) });
}
