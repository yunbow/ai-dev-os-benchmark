"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withAction, actionSuccess, ActionErrors } from "@/lib/action-helpers";
import { canModifyTask, requireTeamRole } from "@/lib/permissions";
import { listTasks, getTaskById } from "./queries";
import {
  TaskCreateSchema,
  TaskUpdateSchema,
  TaskFilterSchema,
  ToggleStatusSchema,
} from "./schemas";
import type { TaskCreateInput, TaskUpdateInput, TaskFilterInput, ToggleStatusInput } from "./schemas";
import type { ActionResult, CursorPaginationResult } from "@/lib/action-helpers";
import type { TaskWithRelations } from "./queries";
import { TaskStatus } from "@prisma/client";

export async function createTask(input: TaskCreateInput): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const validated = TaskCreateSchema.parse(input);

    // If assigning to a team, verify membership
    if (validated.teamId) {
      const membership = await requireTeamRole(validated.teamId, session.user.id, "MEMBER");
      if (!("member" in membership)) return membership;
    }

    const task = await prisma.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        status: validated.status,
        priority: validated.priority,
        dueDate: validated.dueDate,
        categoryId: validated.categoryId,
        assigneeId: validated.assigneeId,
        teamId: validated.teamId,
        userId: session.user.id,
      },
      include: {
        category: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return actionSuccess(task);
  });
}

export async function updateTask(
  taskId: string,
  input: TaskUpdateInput
): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const validated = TaskUpdateSchema.parse(input);

    const task = await getTaskById(taskId);
    if (!task) return ActionErrors.notFound("Task");

    // IDOR prevention: only creator or team admin can modify
    const canModify = await canModifyTask(task, session.user.id);
    if (!canModify) return ActionErrors.forbidden();

    // Optimistic concurrency check
    if (validated.updatedAt && task.updatedAt > validated.updatedAt) {
      return {
        success: false,
        error: {
          code: "CONFLICT",
          message: "Task was modified by someone else. Please refresh and try again.",
        },
      };
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(validated.title !== undefined ? { title: validated.title } : {}),
        ...(validated.description !== undefined ? { description: validated.description } : {}),
        ...(validated.status !== undefined ? { status: validated.status } : {}),
        ...(validated.priority !== undefined ? { priority: validated.priority } : {}),
        ...(validated.dueDate !== undefined ? { dueDate: validated.dueDate } : {}),
        ...(validated.categoryId !== undefined ? { categoryId: validated.categoryId } : {}),
        ...(validated.assigneeId !== undefined ? { assigneeId: validated.assigneeId } : {}),
      },
      include: {
        category: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return actionSuccess(updated);
  });
}

export async function deleteTask(taskId: string): Promise<ActionResult<void>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const task = await getTaskById(taskId);
    if (!task) return ActionErrors.notFound("Task");

    // IDOR prevention
    const canModify = await canModifyTask(task, session.user.id);
    if (!canModify) return ActionErrors.forbidden();

    await prisma.task.delete({ where: { id: taskId } });

    return actionSuccess(undefined);
  });
}

export async function toggleTaskStatus(
  input: ToggleStatusInput
): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const validated = ToggleStatusSchema.parse(input);

    const task = await getTaskById(validated.taskId);
    if (!task) return ActionErrors.notFound("Task");

    // Team members can change task status
    if (task.teamId) {
      const membership = await requireTeamRole(task.teamId, session.user.id, "MEMBER");
      if (!("member" in membership)) return membership;
    } else {
      // Personal task - only creator
      if (task.userId !== session.user.id) return ActionErrors.forbidden();
    }

    // Optimistic concurrency check
    if (validated.expectedUpdatedAt && task.updatedAt > validated.expectedUpdatedAt) {
      return {
        success: false,
        error: {
          code: "CONFLICT",
          message: "Task was modified by someone else. Please refresh and try again.",
        },
      };
    }

    // Cycle status: TODO → IN_PROGRESS → DONE → TODO
    const statusCycle: Record<TaskStatus, TaskStatus> = {
      TODO: "IN_PROGRESS",
      IN_PROGRESS: "DONE",
      DONE: "TODO",
    };

    const updated = await prisma.task.update({
      where: { id: validated.taskId },
      data: { status: statusCycle[task.status] },
      include: {
        category: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return actionSuccess(updated);
  });
}

export async function getTasks(
  filters: TaskFilterInput
): Promise<ActionResult<CursorPaginationResult<TaskWithRelations>>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const validated = TaskFilterSchema.parse(filters);

    // If fetching team tasks, verify membership
    if (validated.teamId) {
      const membership = await requireTeamRole(validated.teamId, session.user.id, "VIEWER");
      if (!("member" in membership)) return membership;
    }

    const result = await listTasks(session.user.id, validated);

    return actionSuccess(result);
  });
}
