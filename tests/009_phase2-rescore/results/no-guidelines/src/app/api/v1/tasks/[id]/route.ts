import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateTaskSchema } from "@/lib/validations/task";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiInternalError,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";
import { TeamRole } from "@prisma/client";

async function getTaskWithAuth(taskId: string, userId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      category: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true, image: true } },
      creator: { select: { id: true, name: true, email: true } },
      team: {
        include: { members: { where: { userId } } },
      },
    },
  });

  if (!task) return { task: null, canRead: false, canWrite: false };

  const isCreator = task.creatorId === userId;
  const teamMember = task.team?.members[0];
  const isTeamMember = !!teamMember;
  const isTeamOwner = teamMember?.role === TeamRole.OWNER;

  const canRead = isCreator || isTeamMember || !task.teamId;
  const canWrite = isCreator || isTeamOwner;

  return { task, canRead, canWrite };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = readRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;
  const { task, canRead } = await getTaskWithAuth(id, session.user.id);

  if (!task) return apiNotFound("Task not found");
  if (!canRead) return apiForbidden();

  return apiSuccess(task);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = writeRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;
  const { task, canWrite } = await getTaskWithAuth(id, session.user.id);

  if (!task) return apiNotFound("Task not found");
  if (!canWrite) return apiForbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Invalid JSON body", details: [] }, 400);
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error.errors);

  try {
    const updated = await db.task.update({
      where: { id },
      data: {
        ...parsed.data,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return apiSuccess(updated);
  } catch {
    return apiInternalError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = writeRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;
  const { task, canWrite } = await getTaskWithAuth(id, session.user.id);

  if (!task) return apiNotFound("Task not found");
  if (!canWrite) return apiForbidden();

  try {
    await db.task.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return apiInternalError();
  }
}
