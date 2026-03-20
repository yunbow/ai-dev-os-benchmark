"use server";

import { prisma } from "@/lib/prisma/client";
import {
  withAction,
  requireAuth,
  createActionSuccess,
  ActionErrors,
  executeCursorPaginatedQuery,
  type ActionResult,
  type CursorPaginatedResult,
} from "@/lib/actions/action-helpers";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  UpdateTaskStatusSchema,
  DeleteTaskSchema,
  ListTasksSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type UpdateTaskStatusInput,
  type DeleteTaskInput,
  type ListTasksInput,
} from "../schema/task-schema";
import type { TaskWithRelations } from "../types/task-types";
import { TaskStatus, Priority, TeamRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

const TASK_INCLUDE = {
  creator: { select: { id: true, name: true, email: true, image: true } },
  assignee: { select: { id: true, name: true, email: true, image: true } },
  category: { select: { id: true, name: true, color: true } },
  team: { select: { id: true, name: true } },
} as const;

async function verifyTaskAccess(
  taskId: string,
  userId: string,
  requireOwnerOrAdmin = false
): Promise<{ success: true; task: TaskWithRelations } | { success: false; error: { code: string; message: string } }> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: TASK_INCLUDE,
  });

  if (!task) return ActionErrors.notFound("Task");

  if (task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: task.teamId, userId } },
    });
    if (!membership) return ActionErrors.forbidden();

    if (requireOwnerOrAdmin) {
      const isCreator = task.creatorId === userId;
      const isAdmin = membership.role === TeamRole.OWNER;
      if (!isCreator && !isAdmin) return ActionErrors.forbidden();
    }
  } else {
    if (requireOwnerOrAdmin && task.creatorId !== userId) {
      return ActionErrors.forbidden();
    }
  }

  return { success: true, task: task as TaskWithRelations };
}

export async function createTask(data: CreateTaskInput): Promise<ActionResult<TaskWithRelations>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      // If assigning to a team, verify membership
      if (validData.teamId) {
        const membership = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId: validData.teamId, userId: authResult.userId } },
        });
        if (!membership) return ActionErrors.forbidden("You are not a member of this team");
        if (membership.role === TeamRole.VIEWER) return ActionErrors.forbidden("Viewers cannot create tasks");
      }

      const task = await prisma.task.create({
        data: {
          title: validData.title,
          description: validData.description,
          status: validData.status,
          priority: validData.priority,
          dueDate: validData.dueDate ? new Date(validData.dueDate) : null,
          categoryId: validData.categoryId ?? null,
          assigneeId: validData.assigneeId ?? null,
          teamId: validData.teamId ?? null,
          creatorId: authResult.userId,
        },
        include: TASK_INCLUDE,
      });

      revalidatePath("/tasks");
      return createActionSuccess(task as TaskWithRelations);
    },
    { data, schema: CreateTaskSchema }
  );
}

export async function listTasks(
  data: ListTasksInput
): Promise<ActionResult<CursorPaginatedResult<TaskWithRelations>>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      // Build priority ordering for Prisma
      const priorityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

      const where: Record<string, unknown> = {};

      if (validData.teamId) {
        // Verify team membership
        const membership = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId: validData.teamId, userId: authResult.userId } },
        });
        if (!membership) return ActionErrors.forbidden();
        where.teamId = validData.teamId;
      } else {
        where.teamId = null;
        where.creatorId = authResult.userId;
      }

      if (validData.status) where.status = validData.status;
      if (validData.priority) where.priority = validData.priority;
      if (validData.categoryId) where.categoryId = validData.categoryId;
      if (validData.assigneeId) where.assigneeId = validData.assigneeId;

      if (validData.search) {
        where.OR = [
          { title: { contains: validData.search, mode: "insensitive" } },
          { description: { contains: validData.search, mode: "insensitive" } },
        ];
      }

      let orderBy: Record<string, string>;
      if (validData.sortBy === "priority") {
        // Sort by priority using a case-like ordering
        orderBy = { priority: validData.sortOrder };
      } else {
        orderBy = { [validData.sortBy]: validData.sortOrder };
      }

      const result = await executeCursorPaginatedQuery<TaskWithRelations>(
        (args) => prisma.task.findMany({ ...args, include: TASK_INCLUDE }) as Promise<TaskWithRelations[]>,
        {
          where,
          orderBy,
          cursor: validData.cursor,
          take: 20,
        }
      );

      return createActionSuccess(result);
    },
    { data, schema: ListTasksSchema }
  );
}

export async function getTask(taskId: string): Promise<ActionResult<TaskWithRelations>> {
  return withAction(
    async () => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const accessResult = await verifyTaskAccess(taskId, authResult.userId);
      if (!accessResult.success) return accessResult;

      return createActionSuccess(accessResult.task);
    },
    {}
  );
}

export async function updateTask(data: UpdateTaskInput): Promise<ActionResult<TaskWithRelations>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const accessResult = await verifyTaskAccess(validData.id, authResult.userId, true);
      if (!accessResult.success) return accessResult;

      const { id, dueDate, ...rest } = validData;
      const task = await prisma.task.update({
        where: { id },
        data: {
          ...rest,
          dueDate: dueDate ? new Date(dueDate) : undefined,
        },
        include: TASK_INCLUDE,
      });

      revalidatePath("/tasks");
      return createActionSuccess(task as TaskWithRelations);
    },
    { data, schema: UpdateTaskSchema }
  );
}

export async function updateTaskStatus(
  data: UpdateTaskStatusInput
): Promise<ActionResult<TaskWithRelations>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const accessResult = await verifyTaskAccess(validData.id, authResult.userId);
      if (!accessResult.success) return accessResult;

      // Optimistic concurrency check
      if (accessResult.task.updatedAt.toISOString() !== validData.updatedAt) {
        return ActionErrors.conflict(
          "This task was recently updated. Please refresh and try again."
        );
      }

      const task = await prisma.task.update({
        where: { id: validData.id },
        data: { status: validData.status },
        include: TASK_INCLUDE,
      });

      revalidatePath("/tasks");
      return createActionSuccess(task as TaskWithRelations);
    },
    { data, schema: UpdateTaskStatusSchema }
  );
}

export async function deleteTask(data: DeleteTaskInput): Promise<ActionResult<void>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const accessResult = await verifyTaskAccess(validData.id, authResult.userId, true);
      if (!accessResult.success) return accessResult;

      await prisma.task.delete({ where: { id: validData.id } });

      revalidatePath("/tasks");
      return createActionSuccess(undefined);
    },
    { data, schema: DeleteTaskSchema }
  );
}
