import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createTaskSchema, taskFiltersSchema } from "@/lib/validations/task";
import {
  apiSuccess,
  zodErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  rateLimitResponse,
  invalidBodyResponse,
} from "@/lib/api-response";
import { Prisma, TaskPriority } from "@prisma/client";

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`read:${ip}`, RATE_LIMITS.read.limit, RATE_LIMITS.read.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = taskFiltersSchema.safeParse(searchParams);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { status, priority, categoryId, assigneeId, teamId, search, sortBy, sortOrder, cursor, pageSize } =
    parsed.data;

  const userId = session.user.id;

  const where: Prisma.TaskWhereInput = {
    OR: [
      { creatorId: userId },
      { assigneeId: userId },
      teamId
        ? { teamId, team: { members: { some: { userId } } } }
        : {},
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
  };

  const orderBy: Prisma.TaskOrderByWithRelationInput =
    sortBy === "priority"
      ? { priority: sortOrder }
      : { [sortBy]: sortOrder };

  const take = pageSize + 1;
  const tasks = await db.task.findMany({
    where,
    orderBy,
    take,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      category: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true, image: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  const hasMore = tasks.length > pageSize;
  const data = hasMore ? tasks.slice(0, pageSize) : tasks;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return apiSuccess({ data, nextCursor, hasMore });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`write:${ip}`, RATE_LIMITS.write.limit, RATE_LIMITS.write.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const body = await req.json().catch(() => null);
  if (!body) return invalidBodyResponse();

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const userId = session.user.id;

  if (parsed.data.teamId) {
    const member = await db.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: parsed.data.teamId } },
    });
    if (!member || member.role === "VIEWER") return forbiddenResponse();
  }

  const task = await db.task.create({
    data: {
      ...parsed.data,
      creatorId: userId,
      dueDate: parsed.data.dueDate ?? null,
      categoryId: parsed.data.categoryId ?? null,
      assigneeId: parsed.data.assigneeId ?? null,
      teamId: parsed.data.teamId ?? null,
    },
    include: {
      category: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  return apiSuccess(task, 201);
}
