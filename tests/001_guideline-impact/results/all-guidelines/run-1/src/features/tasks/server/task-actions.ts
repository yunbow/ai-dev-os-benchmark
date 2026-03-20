"use server";

import { prisma } from "@/lib/prisma";
import {
  withAction,
  requireAuth,
  requireOwnership,
  requireTeamMember,
  createActionSuccess,
  executeCursorPaginatedQuery,
  type ActionResult,
  type PaginatedResult,
} from "@/lib/actions/action-helpers";
import {
  createTaskSchema,
  updateTaskSchema,
  taskFilterSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskFilterInput,
} from "../schema/task-schema";
import type { Task, TaskStatus, TaskPriority, Prisma } from "@prisma/client";

type TaskWithRelations = Task & {
  category: { id: string; name: string; color: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  creator: { id: string; name: string | null; email: string };
};

export async function createTask(
  input: CreateTaskInput
): Promise<ActionResult<TaskWithRelations>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const { teamId, assigneeId, categoryId, dueDate, ...rest } = validData!;

      // Verify team membership if creating a team task
      if (teamId) {
        const memberResult = await requireTeamMember(
          teamId,
          authResult.userId,
          ["OWNER", "MEMBER"]
        );
        if (!memberResult.success) return memberResult;
      }

      const task = await prisma.task.create({
        data: {
          ...rest,
          dueDate: dueDate ? new Date(dueDate) : null,
          creatorId: authResult.userId,
          assigneeId: assigneeId ?? null,
          categoryId: categoryId ?? null,
          teamId: teamId ?? null,
        },
        include: {
          category: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });

      return createActionSuccess(task);
    },
    { data: input, schema: createTaskSchema }
  );
}

export async function listTasks(
  input: TaskFilterInput
): Promise<ActionResult<PaginatedResult<TaskWithRelations>>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const {
        status,
        priority,
        categoryId,
        assigneeId,
        teamId,
        search,
        sortBy,
        sortOrder,
        cursor,
        limit,
      } = validData!;

      // Build where clause
      const where: Record<string, unknown> = {};

      if (teamId) {
        // Verify team access
        const memberResult = await requireTeamMember(
          teamId,
          authResult.userId
        );
        if (!memberResult.success) return memberResult;
        where.teamId = teamId;
      } else {
        // Personal tasks
        where.creatorId = authResult.userId;
        where.teamId = null;
      }

      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (categoryId) where.categoryId = categoryId;
      if (assigneeId) where.assigneeId = assigneeId;

      // Full-text search with parameterized query (SQL injection prevention)
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Priority ordering for sort
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

      const orderBy =
        sortBy === "priority"
          ? [{ priority: sortOrder }]
          : [{ [sortBy]: sortOrder }];

      const result = await executeCursorPaginatedQuery<TaskWithRelations>(
        ({ cursor: c, take, skip }) =>
          prisma.task.findMany({
            cursor: c,
            take,
            skip,
            where: where as Prisma.TaskWhereInput,
            orderBy: orderBy as Prisma.TaskOrderByWithRelationInput | Prisma.TaskOrderByWithRelationInput[],
            include: {
              category: { select: { id: true, name: true, color: true } },
              assignee: { select: { id: true, name: true, email: true } },
              creator: { select: { id: true, name: true, email: true } },
            },
          }) as Promise<TaskWithRelations[]>,
        { cursor, limit }
      );

      return createActionSuccess(result);
    },
    { data: input, schema: taskFilterSchema }
  );
}

export async function getTask(
  taskId: string
): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        category: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Task not found" },
      };
    }

    // Check access
    if (task.teamId) {
      const memberResult = await requireTeamMember(
        task.teamId,
        authResult.userId
      );
      if (!memberResult.success) return memberResult;
    } else if (task.creatorId !== authResult.userId) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied" },
      };
    }

    return createActionSuccess(task);
  });
}

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput
): Promise<ActionResult<TaskWithRelations>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const task = await prisma.task.findUnique({ where: { id: taskId } });

      if (!task) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Task not found" },
        };
      }

      // Check permissions: creator or team admin can edit
      if (task.teamId) {
        const memberResult = await requireTeamMember(
          task.teamId,
          authResult.userId,
          ["OWNER", "MEMBER"]
        );
        if (!memberResult.success) {
          // Allow if creator
          if (task.creatorId !== authResult.userId) return memberResult;
        }
      } else {
        // IDOR prevention: only creator can edit personal tasks
        const ownershipResult = await requireOwnership(
          task,
          authResult.userId
        );
        if (!ownershipResult.success) return ownershipResult;
      }

      // Optimistic concurrency check
      if (validData!.updatedAt) {
        const clientUpdatedAt = new Date(validData!.updatedAt);
        if (task.updatedAt > clientUpdatedAt) {
          return {
            success: false,
            error: {
              code: "CONFLICT",
              message: "Task has been updated by another user. Please refresh.",
            },
          };
        }
      }

      const { updatedAt, dueDate, ...rest } = validData!;

      const updated = await prisma.task.update({
        where: { id: taskId },
        data: {
          ...rest,
          dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        },
        include: {
          category: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });

      return createActionSuccess(updated);
    },
    { data: input, schema: updateTaskSchema }
  );
}

export async function deleteTask(
  taskId: string
): Promise<ActionResult<void>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Task not found" },
      };
    }

    // Check permissions: creator or team owner/admin can delete
    if (task.teamId) {
      const memberResult = await requireTeamMember(
        task.teamId,
        authResult.userId,
        ["OWNER", "MEMBER"]
      );
      if (!memberResult.success) {
        if (task.creatorId !== authResult.userId) return memberResult;
      }
    } else {
      const ownershipResult = await requireOwnership(task, authResult.userId);
      if (!ownershipResult.success) return ownershipResult;
    }

    await prisma.task.delete({ where: { id: taskId } });

    return createActionSuccess(undefined);
  });
}

export async function toggleTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<ActionResult<{ id: string; status: TaskStatus; updatedAt: Date }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Task not found" },
      };
    }

    // Check access
    if (task.teamId) {
      const memberResult = await requireTeamMember(
        task.teamId,
        authResult.userId,
        ["OWNER", "MEMBER"]
      );
      if (!memberResult.success) return memberResult;
    } else if (task.creatorId !== authResult.userId) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied" },
      };
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      select: { id: true, status: true, updatedAt: true },
    });

    return createActionSuccess(updated);
  });
}
