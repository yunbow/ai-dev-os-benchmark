import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { CreateTaskSchema, ListTasksSchema } from "@/features/tasks/schema/task-schema";
import { TeamRole } from "@prisma/client";
import type { NextRequest } from "next/server";

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return Response.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

const TASK_INCLUDE = {
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  category: { select: { id: true, name: true, color: true } },
  team: { select: { id: true, name: true } },
};

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success: rateLimitOk } = await checkRateLimit(`read:${session.user.id}`, RATE_LIMITS.read);
  if (!rateLimitOk) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests", 429);

  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  const parsed = ListTasksSchema.safeParse({
    ...rawParams,
    sortBy: rawParams.sortBy ?? "createdAt",
    sortOrder: rawParams.sortOrder ?? "desc",
  });

  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid query parameters", 400, parsed.error.flatten().fieldErrors);
  }

  const { status, priority, categoryId, assigneeId, teamId, search, sortBy, sortOrder, cursor } = parsed.data;

  // Verify team membership if filtering by team
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!membership) return errorResponse("FORBIDDEN", "You are not a member of this team", 403);
  }

  const where: Record<string, unknown> = teamId
    ? { teamId }
    : { teamId: null, creatorId: session.user.id };

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (categoryId) where.categoryId = categoryId;
  if (assigneeId) where.assigneeId = assigneeId;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const take = 20;
  const tasks = await prisma.task.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: TASK_INCLUDE,
  });

  const hasMore = tasks.length > take;
  const data = hasMore ? tasks.slice(0, take) : tasks;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return Response.json({ data, nextCursor, hasMore });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success: rateLimitOk } = await checkRateLimit(`write:${session.user.id}`, RATE_LIMITS.write);
  if (!rateLimitOk) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);
  }

  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const { teamId, dueDate, ...rest } = parsed.data;

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!membership) return errorResponse("FORBIDDEN", "You are not a member of this team", 403);
    if (membership.role === TeamRole.VIEWER) return errorResponse("FORBIDDEN", "Viewers cannot create tasks", 403);
  }

  try {
    const task = await prisma.task.create({
      data: {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId: session.user.id,
        teamId: teamId ?? null,
      },
      include: TASK_INCLUDE,
    });

    return Response.json(task, { status: 201 });
  } catch (err) {
    console.error("Create task error:", err);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
