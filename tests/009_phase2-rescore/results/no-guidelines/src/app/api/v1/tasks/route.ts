import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTaskSchema, taskFilterSchema } from "@/lib/validations/task";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiInternalError,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";
import { TaskPriority, TaskStatus, TeamRole, Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

export async function GET(req: NextRequest) {
  const limited = readRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = taskFilterSchema.safeParse(params);
  if (!parsed.success) {
    return apiValidationError(parsed.error.errors);
  }

  const { status, priority, categoryId, assigneeId, teamId, search, cursor, sortBy, sortOrder } =
    parsed.data;

  const where: Prisma.TaskWhereInput = {
    OR: [
      { creatorId: session.user.id, teamId: null },
      {
        team: {
          members: {
            some: { userId: session.user.id },
          },
        },
      },
    ],
    ...(status && { status }),
    ...(priority && { priority }),
    ...(categoryId && { categoryId }),
    ...(assigneeId && { assigneeId }),
    ...(teamId && { teamId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(cursor && { id: { lt: cursor } }),
  };

  try {
    const tasks = await db.task.findMany({
      where,
      take: PAGE_SIZE + 1,
      orderBy: sortBy === "priority"
        ? [{ priority: sortOrder }, { createdAt: "desc" }]
        : { [sortBy]: sortOrder },
      include: {
        category: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    const hasMore = tasks.length > PAGE_SIZE;
    const data = tasks.slice(0, PAGE_SIZE);
    const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

    return apiSuccess({ data, nextCursor, hasMore });
  } catch {
    return apiInternalError();
  }
}

export async function POST(req: NextRequest) {
  const limited = writeRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Invalid JSON body", details: [] }, 400);
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error.errors);

  const { teamId, ...rest } = parsed.data;

  if (teamId) {
    const member = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!member || member.role === TeamRole.VIEWER) return apiForbidden();
  }

  try {
    const task = await db.task.create({
      data: {
        ...rest,
        dueDate: rest.dueDate ? new Date(rest.dueDate) : null,
        creatorId: session.user.id,
        teamId: teamId ?? null,
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return apiSuccess(task, 201);
  } catch {
    return apiInternalError();
  }
}
