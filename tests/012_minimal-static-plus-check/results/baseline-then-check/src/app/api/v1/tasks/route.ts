import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, taskFilterSchema } from "@/lib/validations";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";
import { TaskStatus, TaskPriority, Prisma } from "@prisma/client";

function errorResponse(
  code: string,
  message: string,
  details: unknown[] = [],
  status = 400
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

export async function GET(req: NextRequest) {
  const rateLimitResponse = readRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401);
  }

  const { searchParams } = req.nextUrl;
  const filterRaw = {
    status: searchParams.get("status") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    assigneeId: searchParams.get("assigneeId") ?? undefined,
    teamId: searchParams.get("teamId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    sortBy: searchParams.get("sortBy") ?? "createdAt",
    sortOrder: searchParams.get("sortOrder") ?? "desc",
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
  };

  const parsed = taskFilterSchema.safeParse(filterRaw);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid filter parameters", parsed.error.issues);
  }

  const { status, priority, categoryId, assigneeId, teamId, search, sortBy, sortOrder, cursor, limit } = parsed.data;

  const where: Prisma.TaskWhereInput = {
    OR: [
      { creatorId: session.user.id },
      { assigneeId: session.user.id },
      { team: { members: { some: { userId: session.user.id } } } },
    ],
    ...(status && { status: status as TaskStatus }),
    ...(priority && { priority: priority as TaskPriority }),
    ...(categoryId && { categoryId }),
    ...(assigneeId && { assigneeId }),
    ...(teamId && { teamId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const orderBy: Prisma.TaskOrderByWithRelationInput =
    sortBy === "priority" ? { priority: sortOrder } : { [sortBy]: sortOrder };

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, color: true } },
      team: { select: { id: true, name: true } },
    },
  });

  const hasMore = tasks.length > limit;
  const items = hasMore ? tasks.slice(0, -1) : tasks;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = writeRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_REQUEST", "Invalid JSON body");
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.issues);
  }

  const { title, description, status, priority, dueDate, categoryId, assigneeId, teamId } = parsed.data;

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!membership || membership.role === "VIEWER") {
      return errorResponse("FORBIDDEN", "Insufficient permissions", [], 403);
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status: status as TaskStatus,
      priority: priority as TaskPriority,
      dueDate: dueDate ? new Date(dueDate) : null,
      categoryId: categoryId || null,
      assigneeId: assigneeId || null,
      teamId: teamId || null,
      creatorId: session.user.id,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, color: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: task }, { status: 201 });
}
