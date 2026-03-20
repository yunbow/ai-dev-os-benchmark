"use server";

import { prisma } from "@/lib/prisma/client";
import {
  withAction,
  requireAuth,
  ActionResult,
  PaginatedResult,
  executePaginatedQuery,
} from "@/lib/actions/action-helpers";
import { ActionErrors } from "@/lib/actions/errors";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskFilterSchema,
  SearchTasksSchema,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterInput,
  SearchTasksInput,
} from "../schema/task-schema";
import { Task, TaskStatus } from "@prisma/client";

const taskInclude = {
  category: true,
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
  team: { select: { id: true, name: true } },
};

type TaskWithRelations = Task & {
  category: { id: string; name: string; color: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  creator: { id: string; name: string | null; email: string };
  team: { id: string; name: string } | null;
};

export async function createTask(
  input: CreateTaskInput
): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const parsed = CreateTaskSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    const { dueDate, ...rest } = parsed.data;

    const task = await prisma.task.create({
      data: {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId: session.user.id,
      },
      include: taskInclude,
    });

    return { success: true, data: task as TaskWithRelations };
  });
}

export async function getTasks(
  input: TaskFilterInput
): Promise<ActionResult<PaginatedResult<TaskWithRelations>>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const parsed = TaskFilterSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    const { cursor, pageSize, ...filters } = parsed.data;

    const where = {
      OR: [
        { creatorId: session.user.id },
        { assigneeId: session.user.id },
        {
          team: {
            members: {
              some: { userId: session.user.id },
            },
          },
        },
      ],
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.teamId && { teamId: filters.teamId }),
      ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" as const } },
          { description: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }),
    };

    const result = await executePaginatedQuery<TaskWithRelations>(
      async ({ take, cursor: cursorObj }) => {
        return prisma.task.findMany({
          where,
          take,
          skip: cursorObj ? 1 : 0,
          cursor: cursorObj,
          orderBy: { createdAt: "desc" },
          include: taskInclude,
        }) as Promise<TaskWithRelations[]>;
      },
      cursor,
      pageSize
    );

    return { success: true, data: result };
  });
}

export async function getTask(id: string): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const task = await prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });

    if (!task) {
      return { success: false, error: ActionErrors.notFound("Task") };
    }

    // Check access: creator, assignee, or team member
    const hasAccess =
      task.creatorId === session.user.id ||
      task.assigneeId === session.user.id ||
      (task.teamId &&
        (await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId: task.teamId, userId: session.user.id } },
        })));

    if (!hasAccess) {
      return { success: false, error: ActionErrors.forbidden() };
    }

    return { success: true, data: task as TaskWithRelations };
  });
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return { success: false, error: ActionErrors.notFound("Task") };
    }

    // IDOR check: only creator or assignee can update
    const canEdit =
      task.creatorId === session.user.id || task.assigneeId === session.user.id;
    if (!canEdit) {
      // Check if MEMBER of team
      if (task.teamId) {
        const teamMember = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId: task.teamId, userId: session.user.id } },
        });
        if (!teamMember || teamMember.role === "VIEWER") {
          return { success: false, error: ActionErrors.forbidden() };
        }
      } else {
        return { success: false, error: ActionErrors.forbidden() };
      }
    }

    const parsed = UpdateTaskSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    const { dueDate, ...rest } = parsed.data;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...rest,
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: taskInclude,
    });

    return { success: true, data: updatedTask as TaskWithRelations };
  });
}

export async function deleteTask(id: string): Promise<ActionResult<{ id: string }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return { success: false, error: ActionErrors.notFound("Task") };
    }

    // IDOR check: only creator can delete
    if (task.creatorId !== session.user.id) {
      return { success: false, error: ActionErrors.forbidden() };
    }

    await prisma.task.delete({ where: { id } });

    return { success: true, data: { id } };
  });
}

export async function toggleTaskStatus(
  id: string,
  status: TaskStatus
): Promise<ActionResult<TaskWithRelations>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return { success: false, error: ActionErrors.notFound("Task") };
    }

    // Check access: creator, assignee, or team MEMBER/OWNER
    const canToggle =
      task.creatorId === session.user.id || task.assigneeId === session.user.id;

    if (!canToggle && task.teamId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: task.teamId, userId: session.user.id } },
      });
      if (!teamMember || teamMember.role === "VIEWER") {
        return { success: false, error: ActionErrors.forbidden() };
      }
    } else if (!canToggle) {
      return { success: false, error: ActionErrors.forbidden() };
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status },
      include: taskInclude,
    });

    return { success: true, data: updatedTask as TaskWithRelations };
  });
}

export async function searchTasks(
  input: SearchTasksInput
): Promise<ActionResult<PaginatedResult<TaskWithRelations>>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const parsed = SearchTasksSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    const { query, cursor } = parsed.data;

    const where = {
      OR: [
        { creatorId: session.user.id },
        { assigneeId: session.user.id },
      ],
      AND: [
        {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
        },
      ],
    };

    const result = await executePaginatedQuery<TaskWithRelations>(
      async ({ take, cursor: cursorObj }) => {
        return prisma.task.findMany({
          where,
          take,
          skip: cursorObj ? 1 : 0,
          cursor: cursorObj,
          orderBy: { createdAt: "desc" },
          include: taskInclude,
        }) as Promise<TaskWithRelations[]>;
      },
      cursor
    );

    return { success: true, data: result };
  });
}
