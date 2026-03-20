"use server";

import { prisma } from "@/lib/prisma/client";
import {
  actionSuccess,
  actionFailure,
  withAction,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import { requireAuth, checkOwnership } from "@/lib/actions/auth-helpers";
import {
  TaskSchema,
  UpdateTaskSchema,
  TaskFiltersSchema,
  type TaskInput,
  type UpdateTaskInput,
  type TaskFiltersInput,
} from "../schema/task-schema";
import type { TaskWithRelations, PaginatedTasks } from "../types/task-types";
import type { Task, TaskStatus } from "@prisma/client";

const TASK_INCLUDE = {
  category: { select: { id: true, name: true, color: true } },
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
  team: { select: { id: true, name: true } },
} as const;

export async function createTask(
  data: TaskInput
): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const parsed = TaskSchema.safeParse(data);
    if (!parsed.success) {
      return actionFailure("VALIDATION_ERROR", "Invalid task data.", {
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      });
    }

    const { teamId, categoryId, assigneeId, ...taskData } = parsed.data;
    const userId = authResult.session.user.id;

    // Verify category belongs to user or team
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { userId: true, teamId: true },
      });
      if (!category || (category.userId !== userId && category.teamId !== teamId)) {
        return actionFailure("FORBIDDEN", "You do not have access to this category.");
      }
    }

    // Verify team membership if teamId provided
    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId } },
        select: { role: true },
      });
      if (!membership) {
        return actionFailure("FORBIDDEN", "You are not a member of this team.");
      }
      if (membership.role === "VIEWER") {
        return actionFailure("FORBIDDEN", "Viewers cannot create tasks.");
      }
    }

    const task = await prisma.task.create({
      data: {
        ...taskData,
        creatorId: userId,
        ...(categoryId ? { categoryId } : {}),
        ...(assigneeId ? { assigneeId } : {}),
        ...(teamId ? { teamId } : {}),
      },
      include: TASK_INCLUDE,
    });

    return actionSuccess(task as TaskWithRelations);
  });
}

export async function updateTask(
  id: string,
  data: UpdateTaskInput
): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const parsed = UpdateTaskSchema.safeParse(data);
    if (!parsed.success) {
      return actionFailure("VALIDATION_ERROR", "Invalid task data.", {
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      });
    }

    const userId = authResult.session.user.id;
    const userRole = authResult.session.user.role;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { creatorId: true, teamId: true },
    });

    if (!existingTask) {
      return actionFailure("NOT_FOUND", "Task not found.");
    }

    // Check ownership or team membership
    if (existingTask.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId: existingTask.teamId } },
        select: { role: true },
      });
      if (!membership) {
        return actionFailure("FORBIDDEN", "You are not a member of this team.");
      }
      if (membership.role === "VIEWER") {
        return actionFailure("FORBIDDEN", "Viewers cannot update tasks.");
      }
      // Members can only update their own tasks
      if (membership.role === "MEMBER" && existingTask.creatorId !== userId) {
        return actionFailure("FORBIDDEN", "You can only update your own tasks.");
      }
    } else {
      const ownershipError = checkOwnership({
        resourceUserId: existingTask.creatorId,
        currentUserId: userId,
        currentUserRole: userRole,
        adminBypass: true,
      });
      if (ownershipError) return ownershipError;
    }

    const { categoryId, assigneeId, teamId, ...taskData } = parsed.data;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...taskData,
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(assigneeId !== undefined ? { assigneeId } : {}),
        ...(teamId !== undefined ? { teamId } : {}),
      },
      include: TASK_INCLUDE,
    });

    return actionSuccess(task as TaskWithRelations);
  });
}

export async function deleteTask(id: string): Promise<ActionResult<{ id: string }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const userId = authResult.session.user.id;
    const userRole = authResult.session.user.role;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { creatorId: true, teamId: true },
    });

    if (!existingTask) {
      return actionFailure("NOT_FOUND", "Task not found.");
    }

    if (existingTask.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId: existingTask.teamId } },
        select: { role: true },
      });
      if (!membership) {
        return actionFailure("FORBIDDEN", "You are not a member of this team.");
      }
      if (membership.role === "VIEWER") {
        return actionFailure("FORBIDDEN", "Viewers cannot delete tasks.");
      }
      if (membership.role === "MEMBER" && existingTask.creatorId !== userId) {
        return actionFailure("FORBIDDEN", "You can only delete your own tasks.");
      }
    } else {
      const ownershipError = checkOwnership({
        resourceUserId: existingTask.creatorId,
        currentUserId: userId,
        currentUserRole: userRole,
        adminBypass: true,
      });
      if (ownershipError) return ownershipError;
    }

    await prisma.task.delete({ where: { id } });

    return actionSuccess({ id });
  });
}

export async function toggleTaskStatus(
  id: string,
  status: TaskStatus,
  updatedAt: Date
): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const userId = authResult.session.user.id;
    const userRole = authResult.session.user.role;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { creatorId: true, teamId: true, updatedAt: true },
    });

    if (!existingTask) {
      return actionFailure("NOT_FOUND", "Task not found.");
    }

    // Optimistic concurrency check
    if (existingTask.updatedAt.getTime() !== new Date(updatedAt).getTime()) {
      return actionFailure(
        "CONFLICT",
        "This task has been modified by someone else. Please refresh and try again."
      );
    }

    // Access control
    if (existingTask.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId: existingTask.teamId } },
        select: { role: true },
      });
      if (!membership) {
        return actionFailure("FORBIDDEN", "You are not a member of this team.");
      }
      if (membership.role === "VIEWER") {
        return actionFailure("FORBIDDEN", "Viewers cannot update tasks.");
      }
      if (membership.role === "MEMBER" && existingTask.creatorId !== userId) {
        return actionFailure("FORBIDDEN", "You can only update your own tasks.");
      }
    } else {
      const ownershipError = checkOwnership({
        resourceUserId: existingTask.creatorId,
        currentUserId: userId,
        currentUserRole: userRole,
        adminBypass: true,
      });
      if (ownershipError) return ownershipError;
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status },
      include: TASK_INCLUDE,
    });

    return actionSuccess(task as TaskWithRelations);
  });
}

export async function getTasks(
  filters: TaskFiltersInput
): Promise<ActionResult<PaginatedTasks>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const parsed = TaskFiltersSchema.safeParse(filters);
    if (!parsed.success) {
      return actionFailure("VALIDATION_ERROR", "Invalid filter parameters.");
    }

    const {
      status,
      priority,
      categoryId,
      assigneeId,
      search,
      cursor,
      sortBy,
      sortOrder,
      teamId,
      limit,
    } = parsed.data;

    const userId = authResult.session.user.id;

    // Build where clause
    const where = {
      AND: [
        // Scope: either own tasks or team tasks
        teamId
          ? {
              teamId,
              team: {
                members: { some: { userId } },
              },
            }
          : { creatorId: userId },
        ...(status ? [{ status }] : []),
        ...(priority ? [{ priority }] : []),
        ...(categoryId ? [{ categoryId }] : []),
        ...(assigneeId ? [{ assigneeId }] : []),
        ...(search
          ? [
              {
                OR: [
                  { title: { contains: search, mode: "insensitive" as const } },
                  {
                    description: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    };

    // Get total count
    const total = await prisma.task.count({ where });

    // Cursor-based pagination
    const tasks = await prisma.task.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: { [sortBy]: sortOrder },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    const hasNextPage = tasks.length > limit;
    const items = hasNextPage ? tasks.slice(0, limit) : tasks;
    const nextCursor = hasNextPage ? items[items.length - 1]?.id : undefined;

    return actionSuccess({
      tasks: items as TaskWithRelations[],
      hasNextPage,
      nextCursor,
      total,
    });
  });
}

export async function getTask(id: string): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const userId = authResult.session.user.id;
    const userRole = authResult.session.user.role;

    const task = await prisma.task.findUnique({
      where: { id },
      include: TASK_INCLUDE,
    });

    if (!task) {
      return actionFailure("NOT_FOUND", "Task not found.");
    }

    // Check access
    if (task.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId: task.teamId } },
        select: { role: true },
      });
      if (!membership) {
        return actionFailure("FORBIDDEN", "You do not have access to this task.");
      }
    } else {
      const ownershipError = checkOwnership({
        resourceUserId: task.creatorId,
        currentUserId: userId,
        currentUserRole: userRole,
        adminBypass: true,
      });
      if (ownershipError) return ownershipError;
    }

    return actionSuccess(task as TaskWithRelations);
  });
}
