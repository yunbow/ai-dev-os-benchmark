import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiRateLimited,
  apiInternalError,
  withRateLimitHeaders,
} from "@/lib/api-response";
import { canModifyTask } from "@/lib/permissions";
import { TaskUpdateSchema } from "@/features/tasks/schemas";
import { getTaskById, taskInclude } from "@/features/tasks/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.read);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const task = await getTaskById(id);
    if (!task) return apiNotFound("Task");

    // IDOR: verify access
    const canAccess =
      task.userId === session.user.id ||
      (task.teamId !== null && (await canModifyTask(task, session.user.id)));

    if (!canAccess) return apiForbidden();

    return withRateLimitHeaders(
      apiSuccess(task),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[GET /api/v1/tasks/:id]", error);
    return apiInternalError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.write);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const body = await request.json().catch(() => null);
    if (!body) return apiError("INVALID_JSON", "Request body must be valid JSON", 400);

    const parsed = TaskUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return apiValidationError(fieldErrors);
    }

    const task = await getTaskById(id);
    if (!task) return apiNotFound("Task");

    // IDOR prevention
    const canModify = await canModifyTask(task, session.user.id);
    if (!canModify) return apiForbidden();

    const data = parsed.data;

    // Optimistic concurrency check
    if (data.updatedAt && task.updatedAt > data.updatedAt) {
      return apiError("CONFLICT", "Task was modified by someone else. Please refresh and try again.", 409);
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId } : {}),
      },
      include: taskInclude,
    });

    return withRateLimitHeaders(
      apiSuccess(updated),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[PATCH /api/v1/tasks/:id]", error);
    return apiInternalError();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.write);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const task = await getTaskById(id);
    if (!task) return apiNotFound("Task");

    // IDOR prevention
    const canModify = await canModifyTask(task, session.user.id);
    if (!canModify) return apiForbidden();

    await prisma.task.delete({ where: { id } });

    return withRateLimitHeaders(
      apiSuccess({ message: "Task deleted successfully" }),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[DELETE /api/v1/tasks/:id]", error);
    return apiInternalError();
  }
}
