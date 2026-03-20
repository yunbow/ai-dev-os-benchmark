import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, taskFilterSchema } from "@/features/tasks/schema/task-schema";

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  const searchParams = req.nextUrl.searchParams;
  const input = {
    status: searchParams.get("status") || undefined,
    priority: searchParams.get("priority") || undefined,
    categoryId: searchParams.get("categoryId") || undefined,
    assigneeId: searchParams.get("assigneeId") || undefined,
    search: searchParams.get("search") || undefined,
    cursor: searchParams.get("cursor") || undefined,
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: searchParams.get("sortOrder") || "desc",
  };

  const parsed = taskFilterSchema.safeParse(input);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid query parameters", 400, parsed.error.flatten());
  }

  const { status, priority, categoryId, assigneeId, search, cursor, sortBy, sortOrder } = parsed.data;

  const where: Record<string, unknown> = {
    OR: [
      { creatorId: session.user.id },
      { assigneeId: session.user.id },
      { team: { members: { some: { userId: session.user.id } } } },
    ],
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

  const tasks = await prisma.task.findMany({
    where,
    take: 21,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: sortBy === "priority" ? { priority: sortOrder } : { [sortBy]: sortOrder },
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true, image: true } },
      creator: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const hasMore = tasks.length > 20;
  const data = hasMore ? tasks.slice(0, 20) : tasks;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return NextResponse.json({ data, nextCursor, hasMore });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten());
  }

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      creatorId: session.user.id,
    },
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({ data: task }, { status: 201 });
}
