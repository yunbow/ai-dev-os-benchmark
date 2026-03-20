"use server";

import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/auth/require-auth";
import { withAction, ActionResult, ActionErrors, PaginatedResult } from "@/lib/actions/action-helpers";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  listTasksSchema,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  ListTasksInput,
} from "../schema/task-schema";
import { Task, TaskPriority } from "@prisma/client";

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

type TaskWithRelations = Task & {
  category: { id: string; name: string; color: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  creator: { id: string; name: string | null; email: string };
};

async function verifyTaskAccess(
  taskId: string,
  userId: string,
  requireWrite = false
): Promise<{ success: true; task: TaskWithRelations } | ReturnType<typeof ActionErrors.notFound>> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      category: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  if (!task) return ActionErrors.notFound("Task");

  if (task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: task.teamId } },
    });
    if (!membership) return ActionErrors.notFound("Task");

    if (requireWrite) {
      const canWrite =
        membership.role === "OWNER" ||
        (membership.role === "MEMBER" && task.creatorId === userId);
      if (!canWrite) return ActionErrors.forbidden();
    }
  } else {
    if (task.creatorId !== userId) return ActionErrors.notFound("Task");
  }

  return { success: true, task };
}

export async function createTaskAction(data: CreateTaskInput): Promise<ActionResult<Task>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      if (validData!.teamId) {
        const membership = await prisma.teamMember.findUnique({
          where: { userId_teamId: { userId: authResult.userId, teamId: validData!.teamId } },
        });
        if (!membership || membership.role === "VIEWER") return ActionErrors.forbidden();
      }

      const task = await prisma.task.create({
        data: { ...validData!, creatorId: authResult.userId },
      });

      return { success: true, data: task };
    },
    { data, schema: createTaskSchema }
  );
}

export async function listTasksAction(
  data: ListTasksInput
): Promise<ActionResult<PaginatedResult<TaskWithRelations>>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const { cursor, limit, sortBy, sortOrder, teamId, search, ...filters } = validData!;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        ...filters,
        ...(teamId
          ? {
              teamId,
              team: {
                members: { some: { userId: authResult.userId } },
              },
            }
          : { creatorId: authResult.userId, teamId: null }),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const orderBy =
        sortBy === "priority"
          ? undefined
          : { [sortBy]: sortOrder };

      const items = await prisma.task.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
        orderBy,
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      if (sortBy === "priority") {
        items.sort((a, b) => {
          const diff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
          return sortOrder === "asc" ? -diff : diff;
        });
      }

      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;
      const nextCursor = hasMore ? data[data.length - 1].id : null;

      return { success: true, data: { items: data, nextCursor, hasMore } };
    },
    { data, schema: listTasksSchema }
  );
}

export async function getTaskAction(taskId: string): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const result = await verifyTaskAccess(taskId, authResult.userId);
    if (!result.success) return result;

    return { success: true, data: result.task };
  });
}

export async function updateTaskAction(
  taskId: string,
  data: UpdateTaskInput
): Promise<ActionResult<Task>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const access = await verifyTaskAccess(taskId, authResult.userId, true);
      if (!access.success) return access;

      if (validData!.updatedAt && access.task.updatedAt > validData!.updatedAt) {
        return ActionErrors.conflict("This task was modified by someone else. Please refresh and try again.");
      }

      const { updatedAt: _, ...updateData } = validData!;
      const task = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
      });

      return { success: true, data: task };
    },
    { data, schema: updateTaskSchema }
  );
}

export async function updateTaskStatusAction(
  taskId: string,
  data: UpdateTaskStatusInput
): Promise<ActionResult<Task>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const access = await verifyTaskAccess(taskId, authResult.userId);
      if (!access.success) return access;

      if (validData!.updatedAt && access.task.updatedAt > validData!.updatedAt) {
        return ActionErrors.conflict("This task was modified by someone else. Please refresh.");
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: { status: validData!.status },
      });

      return { success: true, data: task };
    },
    { data, schema: updateTaskStatusSchema }
  );
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult<void>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const access = await verifyTaskAccess(taskId, authResult.userId, true);
    if (!access.success) return access;

    await prisma.task.delete({ where: { id: taskId } });

    return { success: true, data: undefined };
  });
}
