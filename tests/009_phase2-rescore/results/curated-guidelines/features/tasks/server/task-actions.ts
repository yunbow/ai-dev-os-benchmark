"use server";

import { prisma } from "@/lib/prisma";
import { withAction, requireAuth, ActionErrors, createSuccess, ActionResult } from "@/lib/actions/action-helpers";
import { createTaskSchema, updateTaskSchema, taskFilterSchema, CreateTaskInput, UpdateTaskInput, TaskFilterInput } from "@/features/tasks/schema/task-schema";
import { Task, TaskStatus } from "@prisma/client";

const TASKS_PER_PAGE = 20;

export async function createTask(input: CreateTaskInput): Promise<ActionResult<Task>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success) {
      return ActionErrors.validation(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    // Verify team membership if teamId provided
    if (parsed.data.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: parsed.data.teamId, userId: authResult.userId },
        },
      });
      if (!membership || membership.role === "VIEWER") {
        return ActionErrors.forbidden();
      }
    }

    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        status: parsed.data.status,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        categoryId: parsed.data.categoryId,
        assigneeId: parsed.data.assigneeId,
        teamId: parsed.data.teamId,
        creatorId: authResult.userId,
      },
      include: { category: true, assignee: { select: { id: true, name: true, email: true, image: true } } },
    });

    return createSuccess(task);
  });
}

export async function getTasks(input: TaskFilterInput): Promise<ActionResult<{
  items: Task[];
  nextCursor: string | null;
  hasMore: boolean;
}>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const parsed = taskFilterSchema.safeParse(input);
    if (!parsed.success) {
      return ActionErrors.validation(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { status, priority, categoryId, assigneeId, search, cursor, sortBy, sortOrder } = parsed.data;

    const where: Record<string, unknown> = {
      OR: [
        { creatorId: authResult.userId },
        { assigneeId: authResult.userId },
        { team: { members: { some: { userId: authResult.userId } } } },
      ],
      ...(status && { status }),
      ...(priority && { priority }),
      ...(categoryId && { categoryId }),
      ...(assigneeId && { assigneeId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const items = await prisma.task.findMany({
      where,
      take: TASKS_PER_PAGE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: sortBy === "priority"
        ? { priority: sortOrder }
        : { [sortBy]: sortOrder },
      include: {
        category: true,
        assignee: { select: { id: true, name: true, email: true, image: true } },
        creator: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    const hasMore = items.length > TASKS_PER_PAGE;
    const data = hasMore ? items.slice(0, TASKS_PER_PAGE) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return createSuccess({ items: data, nextCursor, hasMore });
  });
}

export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<ActionResult<Task>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { team: { include: { members: true } } },
    });

    if (!task) return ActionErrors.notFound("Task");

    // IDOR prevention: check ownership or team admin
    const isCreator = task.creatorId === authResult.userId;
    const isTeamAdmin = task.team?.members.some(
      (m) => m.userId === authResult.userId && (m.role === "OWNER")
    );

    if (!isCreator && !isTeamAdmin) {
      return ActionErrors.forbidden();
    }

    const parsed = updateTaskSchema.safeParse(input);
    if (!parsed.success) {
      return ActionErrors.validation(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...parsed.data,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : parsed.data.dueDate === null ? null : undefined,
      },
      include: {
        category: true,
        assignee: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return createSuccess(updated);
  });
}

export async function deleteTask(taskId: string): Promise<ActionResult<void>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { team: { include: { members: true } } },
    });

    if (!task) return ActionErrors.notFound("Task");

    const isCreator = task.creatorId === authResult.userId;
    const isTeamAdmin = task.team?.members.some(
      (m) => m.userId === authResult.userId && m.role === "OWNER"
    );

    if (!isCreator && !isTeamAdmin) {
      return ActionErrors.forbidden();
    }

    await prisma.task.delete({ where: { id: taskId } });

    return createSuccess(undefined);
  });
}

export async function toggleTaskStatus(taskId: string, status: TaskStatus): Promise<ActionResult<Task>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { team: { include: { members: true } } },
    });

    if (!task) return ActionErrors.notFound("Task");

    const hasAccess =
      task.creatorId === authResult.userId ||
      task.assigneeId === authResult.userId ||
      task.team?.members.some((m) => m.userId === authResult.userId);

    if (!hasAccess) return ActionErrors.forbidden();

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        category: true,
        assignee: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return createSuccess(updated);
  });
}
