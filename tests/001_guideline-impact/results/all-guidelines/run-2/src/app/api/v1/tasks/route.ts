import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, setRateLimitHeaders } from "@/lib/api/rate-limit";
import { CreateTaskSchema, TaskFilterSchema } from "@/features/tasks/schema/task-schema";
import { ZodError } from "zod";
import { Prisma, TaskPriority } from "@prisma/client";

const TASK_INCLUDE = {
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  category: { select: { id: true, name: true, color: true } },
};

function errorResponse(code: string, message: string, status: number, details?: unknown[]) {
  return NextResponse.json(
    { error: { code, message, details: details || [] } },
    { status }
  );
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimitResult = checkRateLimit(`read:${ip}`, "read");
  const headers = new Headers();
  setRateLimitHeaders(headers, rateLimitResult);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests", details: [] } },
      { status: 429, headers }
    );
  }

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  try {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());

    const filter = TaskFilterSchema.parse({
      ...params,
      limit: params.limit ? parseInt(params.limit) : undefined,
    });

    const { cursor, limit, search, sortBy, sortOrder, teamId, ...filters } = filter;

    const where: Prisma.TaskWhereInput = {
      ...filters,
      ...(teamId ? { teamId } : { creatorId: session.user.id, teamId: null }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(cursor && { id: { lt: cursor } }),
    };

    const tasks = await prisma.task.findMany({
      where,
      take: limit + 1,
      orderBy: [{ [sortBy]: sortOrder }],
      include: TASK_INCLUDE,
    });

    const hasMore = tasks.length > limit;
    const data = hasMore ? tasks.slice(0, limit) : tasks;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({ data, nextCursor, hasMore }, { headers });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("VALIDATION_ERROR", "Invalid query parameters", 400, error.errors);
    }
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${ip}`, "write");
  const headers = new Headers();
  setRateLimitHeaders(headers, rateLimitResult);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests", details: [] } },
      { status: 429, headers }
    );
  }

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  try {
    const body = await req.json();
    const validated = CreateTaskSchema.parse(body);

    if (validated.teamId) {
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: session.user.id, teamId: validated.teamId } },
      });
      if (!member) return errorResponse("FORBIDDEN", "You are not a member of this team", 403);
    }

    const task = await prisma.task.create({
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        creatorId: session.user.id,
      },
      include: TASK_INCLUDE,
    });

    return NextResponse.json(task, { status: 201, headers });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse("VALIDATION_ERROR", "Invalid request body", 400, error.errors);
    }
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
