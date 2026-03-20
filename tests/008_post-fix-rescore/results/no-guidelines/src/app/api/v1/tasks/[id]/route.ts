import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateTaskSchema } from "@/lib/validations/task";
import {
  apiSuccess,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiInternalError,
} from "@/lib/api-response";
import {
  writeRateLimiter,
  readRateLimiter,
  getIdentifier,
  rateLimitResponse,
} from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "tasks:read");
  const rateLimitResult = readRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  try {
    const task = await db.task.findFirst({
      where: {
        id,
        OR: [
          { creatorId: session.user.id },
          { assigneeId: session.user.id },
          {
            team: {
              members: { some: { userId: session.user.id } },
            },
          },
        ],
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) return apiNotFound("Task");

    return apiSuccess(task);
  } catch (error) {
    console.error("GET /api/v1/tasks/[id] error:", error);
    return apiInternalError();
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "tasks:write");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return apiBadRequest("Validation failed", details);
    }

    // IDOR protection
    const existingTask = await db.task.findFirst({
      where: {
        id,
        OR: [
          { creatorId: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ["OWNER"] },
                },
              },
            },
          },
        ],
      },
    });

    if (!existingTask) return apiNotFound("Task");

    const { dueDate, categoryId, assigneeId, teamId: _teamId, ...rest } = parsed.data;
    const updateData: Prisma.TaskUpdateInput = { ...rest };

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (categoryId !== undefined) {
      updateData.category = categoryId
        ? { connect: { id: categoryId } }
        : { disconnect: true };
    }
    if (assigneeId !== undefined) {
      updateData.assignee = assigneeId
        ? { connect: { id: assigneeId } }
        : { disconnect: true };
    }

    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return apiSuccess(task);
  } catch (error) {
    console.error("PATCH /api/v1/tasks/[id] error:", error);
    return apiInternalError();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "tasks:write");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  try {
    // IDOR protection
    const task = await db.task.findFirst({
      where: {
        id,
        OR: [
          { creatorId: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ["OWNER"] },
                },
              },
            },
          },
        ],
      },
    });

    if (!task) return apiNotFound("Task");

    await db.task.delete({ where: { id } });

    return apiSuccess({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/v1/tasks/[id] error:", error);
    return apiInternalError();
  }
}
