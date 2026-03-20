import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { UpdateTaskSchema } from "@/features/task/schema/task-schema";
import {
  fetchTaskById,
  canMutateTask,
  taskInclude,
} from "@/features/task/services/task-service";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(
  code: string,
  message: string,
  details: unknown[] = [],
  status = 400,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status, headers: extraHeaders }
  );
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const rl = applyRateLimit(req, "read");
  if (!rl.allowed) return rl.response!;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401, rl.headers);
  }

  const { id } = await params;

  try {
    const task = await fetchTaskById(id, session.user.id);
    if (!task) return errorResponse("NOT_FOUND", "Task not found", [], 404, rl.headers);

    return NextResponse.json({ data: task }, { headers: rl.headers });
  } catch {
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", [], 500, rl.headers);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const rl = applyRateLimit(req, "write");
  if (!rl.allowed) return rl.response!;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401, rl.headers);
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_JSON", "Request body must be valid JSON", [], 400, rl.headers);
  }

  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid input",
      parsed.error.errors,
      400,
      rl.headers
    );
  }

  try {
    const canMutate = await canMutateTask(id, session.user.id);
    if (!canMutate) {
      return errorResponse("FORBIDDEN", "You do not have permission to edit this task", [], 403, rl.headers);
    }

    const { updatedAt: expectedUpdatedAt, ...updateData } = parsed.data;

    if (expectedUpdatedAt) {
      const current = await prisma.task.findUnique({
        where: { id },
        select: { updatedAt: true },
      });
      if (!current) return errorResponse("NOT_FOUND", "Task not found", [], 404, rl.headers);
      if (current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        return errorResponse(
          "CONFLICT",
          "Task was modified by another user",
          [],
          409,
          rl.headers
        );
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updateData,
        description: updateData.description ?? undefined,
        dueDate: updateData.dueDate ?? undefined,
        categoryId: updateData.categoryId ?? undefined,
        assigneeId: updateData.assigneeId ?? undefined,
      },
      include: taskInclude,
    });

    return NextResponse.json({ data: task }, { headers: rl.headers });
  } catch {
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", [], 500, rl.headers);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const rl = applyRateLimit(req, "write");
  if (!rl.allowed) return rl.response!;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401, rl.headers);
  }

  const { id } = await params;

  try {
    const canMutate = await canMutateTask(id, session.user.id);
    if (!canMutate) {
      return errorResponse("FORBIDDEN", "You do not have permission to delete this task", [], 403, rl.headers);
    }

    await prisma.task.delete({ where: { id } });
    return new NextResponse(null, { status: 204, headers: rl.headers });
  } catch {
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", [], 500, rl.headers);
  }
}
