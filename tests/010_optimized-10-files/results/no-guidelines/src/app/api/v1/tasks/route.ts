import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskSchema } from "@/lib/validations";
import { TaskStatus, TaskPriority, Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

function errorResponse(
  code: string,
  message: string,
  status: number,
  details: unknown[] = []
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status") as TaskStatus | null;
  const priority = searchParams.get("priority") as TaskPriority | null;
  const categoryId = searchParams.get("categoryId");
  const assigneeId = searchParams.get("assigneeId");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as
    | "asc"
    | "desc";
  const cursor = searchParams.get("cursor");
  const teamId = searchParams.get("teamId");

  // Validate sort field
  const allowedSortFields = ["createdAt", "dueDate", "priority", "title"];
  if (!allowedSortFields.includes(sortBy)) {
    return errorResponse("INVALID_SORT", "Invalid sort field.", 400);
  }

  // Validate status and priority
  const validStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
  const validPriorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

  if (status && !validStatuses.includes(status)) {
    return errorResponse("INVALID_STATUS", "Invalid status value.", 400);
  }

  if (priority && !validPriorities.includes(priority)) {
    return errorResponse("INVALID_PRIORITY", "Invalid priority value.", 400);
  }

  // Build where clause - user can see their own tasks and team tasks
  const where: Prisma.TaskWhereInput = {
    OR: [
      { creatorId: userId },
      { assigneeId: userId },
      {
        team: {
          members: {
            some: { userId },
          },
        },
      },
    ],
  };

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (categoryId) where.categoryId = categoryId;
  if (assigneeId) where.assigneeId = assigneeId;
  if (teamId) where.teamId = teamId;

  if (search) {
    // Using Prisma's parameterized contains for full-text search
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Build order by
  let orderBy: Prisma.TaskOrderByWithRelationInput = {};
  if (sortBy === "priority") {
    // Map priority to numeric for ordering
    orderBy = { priority: sortOrder };
  } else if (sortBy === "dueDate") {
    orderBy = { dueDate: sortOrder };
  } else if (sortBy === "title") {
    orderBy = { title: sortOrder };
  } else {
    orderBy = { createdAt: sortOrder };
  }

  const tasks = await db.task.findMany({
    where,
    take: PAGE_SIZE + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    orderBy,
    include: {
      category: {
        select: { id: true, name: true, color: true },
      },
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      creator: {
        select: { id: true, name: true, email: true, image: true },
      },
      team: {
        select: { id: true, name: true },
      },
    },
  });

  const hasMore = tasks.length > PAGE_SIZE;
  const data = hasMore ? tasks.slice(0, PAGE_SIZE) : tasks;
  const nextCursor = hasMore ? data[data.length - 1]?.id : null;

  return NextResponse.json({ data, nextCursor, hasMore });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON in request body.", 400);
  }

  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid task data.",
      400,
      parsed.error.issues
    );
  }

  const { teamId, categoryId, assigneeId, ...rest } = parsed.data;

  // Verify team membership if teamId provided
  if (teamId) {
    const member = await db.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!member) {
      return errorResponse(
        "FORBIDDEN",
        "You are not a member of this team.",
        403
      );
    }
  }

  // Verify category ownership if categoryId provided
  if (categoryId) {
    const category = await db.category.findFirst({
      where: {
        id: categoryId,
        OR: [
          { userId },
          { team: { members: { some: { userId } } } },
        ],
      },
    });
    if (!category) {
      return errorResponse("NOT_FOUND", "Category not found.", 404);
    }
  }

  // Verify assignee is a team member if teamId provided
  if (assigneeId && teamId) {
    const assigneeMember = await db.teamMember.findUnique({
      where: { userId_teamId: { userId: assigneeId, teamId } },
    });
    if (!assigneeMember) {
      return errorResponse(
        "INVALID_ASSIGNEE",
        "Assignee is not a member of this team.",
        400
      );
    }
  }

  const task = await db.task.create({
    data: {
      ...rest,
      creatorId: userId,
      teamId: teamId ?? null,
      categoryId: categoryId ?? null,
      assigneeId: assigneeId ?? null,
    },
    include: {
      category: {
        select: { id: true, name: true, color: true },
      },
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      creator: {
        select: { id: true, name: true, email: true, image: true },
      },
      team: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json({ data: task }, { status: 201 });
}
