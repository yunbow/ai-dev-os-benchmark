import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { UpdateTaskSchema } from "@/features/tasks/schema/task-schema";
import { ActionErrors } from "@/lib/actions/errors";

const taskInclude = {
  category: true,
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
  team: { select: { id: true, name: true } },
};

function errorResponse(error: { code: string; message: string }, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(ActionErrors.unauthorized(), 401);
  }

  const rl = rateLimit(`api:read:${session.user.id}`, 100, 60000);
  if (!rl.success) {
    return errorResponse(ActionErrors.rateLimited(), 429);
  }

  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: taskInclude,
  });

  if (!task) {
    return errorResponse({ code: "NOT_FOUND", message: "Task not found" }, 404);
  }

  const hasAccess =
    task.creatorId === session.user.id ||
    task.assigneeId === session.user.id ||
    (task.teamId &&
      (await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: task.teamId, userId: session.user.id } },
      })));

  if (!hasAccess) {
    return errorResponse(ActionErrors.forbidden(), 403);
  }

  return NextResponse.json({ data: task }, { headers: rateLimitHeaders(rl) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(ActionErrors.unauthorized(), 401);
  }

  const rl = rateLimit(`api:write:${session.user.id}`, 30, 60000);
  if (!rl.success) {
    return errorResponse(ActionErrors.rateLimited(), 429);
  }

  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return errorResponse({ code: "NOT_FOUND", message: "Task not found" }, 404);
  }

  const canEdit =
    task.creatorId === session.user.id || task.assigneeId === session.user.id;
  if (!canEdit) {
    if (task.teamId) {
      const member = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: task.teamId, userId: session.user.id } },
      });
      if (!member || member.role === "VIEWER") {
        return errorResponse(ActionErrors.forbidden(), 403);
      }
    } else {
      return errorResponse(ActionErrors.forbidden(), 403);
    }
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return errorResponse(ActionErrors.badRequest("Invalid JSON"), 400);
  }

  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 422 }
    );
  }

  const { dueDate, ...rest } = parsed.data;

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
    include: taskInclude,
  });

  return NextResponse.json({ data: updated }, { headers: rateLimitHeaders(rl) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse(ActionErrors.unauthorized(), 401);
  }

  const rl = rateLimit(`api:write:${session.user.id}`, 30, 60000);
  if (!rl.success) {
    return errorResponse(ActionErrors.rateLimited(), 429);
  }

  const { id } = await params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return errorResponse({ code: "NOT_FOUND", message: "Task not found" }, 404);
  }

  if (task.creatorId !== session.user.id) {
    return errorResponse(ActionErrors.forbidden(), 403);
  }

  await prisma.task.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
