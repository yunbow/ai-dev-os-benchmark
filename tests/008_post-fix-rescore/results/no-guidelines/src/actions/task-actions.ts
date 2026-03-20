"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createTaskSchema,
  updateTaskSchema,
  taskFiltersSchema,
} from "@/lib/validations/task";
import type { ActionResult } from "@/lib/utils";
import type { Task, TaskStatus, TaskPriority, Prisma } from "@prisma/client";

const TASKS_PER_PAGE = 20;

// Priority ordering for sorting
const priorityOrder: Record<TaskPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

type TaskWithRelations = Task & {
  category: { id: string; name: string; color: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  creator: { id: string; name: string | null; email: string };
};

type PaginatedTasks = {
  tasks: TaskWithRelations[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};

export async function getTasks(
  rawFilters: unknown
): Promise<ActionResult<PaginatedTasks>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = taskFiltersSchema.safeParse(rawFilters);
  if (!parsed.success) {
    return { success: false, error: "Invalid filter parameters" };
  }

  const { status, priority, categoryId, assigneeId, teamId, search, cursor, sortBy, sortOrder } =
    parsed.data;

  try {
    // Build WHERE clause - IDOR protection: users only see their own or team tasks
    const where: Prisma.TaskWhereInput = {
      AND: [
        // Access control
        teamId
          ? {
              team: {
                members: {
                  some: { userId: session.user.id },
                },
              },
              teamId,
            }
          : { creatorId: session.user.id, teamId: null },
        // Filters
        status ? { status } : {},
        priority ? { priority } : {},
        categoryId ? { categoryId } : {},
        assigneeId ? { assigneeId } : {},
        // Full-text search using parameterized query (no SQL injection)
        search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        // Cursor-based pagination
        cursor ? { id: { lt: cursor } } : {},
      ],
    };

    // Build ORDER BY
    const orderBy: Prisma.TaskOrderByWithRelationInput =
      sortBy === "priority"
        ? { priority: sortOrder }
        : sortBy === "dueDate"
        ? { dueDate: sortOrder }
        : { createdAt: sortOrder };

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        orderBy,
        take: TASKS_PER_PAGE + 1,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          categoryId: true,
          assigneeId: true,
          creatorId: true,
          teamId: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { id: true, name: true, color: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      db.task.count({ where }),
    ]);

    const hasMore = tasks.length > TASKS_PER_PAGE;
    const paginatedTasks = hasMore ? tasks.slice(0, TASKS_PER_PAGE) : tasks;
    const nextCursor =
      hasMore ? paginatedTasks[paginatedTasks.length - 1].id : null;

    return {
      success: true,
      data: {
        tasks: paginatedTasks as TaskWithRelations[],
        nextCursor,
        hasMore,
        total,
      },
    };
  } catch (error) {
    console.error("getTasks error:", error);
    return { success: false, error: "Failed to fetch tasks" };
  }
}

export async function createTask(
  rawData: unknown
): Promise<ActionResult<Task>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createTaskSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((err) => {
      const key = err.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(err.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { teamId, categoryId, assigneeId, dueDate, ...rest } = parsed.data;

  try {
    // Verify team membership if teamId provided
    if (teamId) {
      const membership = await db.teamMember.findUnique({
        where: {
          teamId_userId: { teamId, userId: session.user.id },
        },
      });
      if (!membership) {
        return { success: false, error: "You are not a member of this team" };
      }
      if (membership.role === "VIEWER") {
        return { success: false, error: "Viewers cannot create tasks" };
      }
    }

    // Verify category ownership
    if (categoryId) {
      const category = await db.category.findFirst({
        where: {
          id: categoryId,
          OR: [
            { userId: session.user.id },
            teamId ? { teamId } : {},
          ],
        },
      });
      if (!category) {
        return { success: false, error: "Category not found" };
      }
    }

    const task = await db.task.create({
      data: {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
        categoryId: categoryId ?? null,
        assigneeId: assigneeId ?? null,
        teamId: teamId ?? null,
        creatorId: session.user.id,
      },
    });

    revalidatePath("/tasks");
    return { success: true, data: task, message: "Task created successfully" };
  } catch (error) {
    console.error("createTask error:", error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTask(
  taskId: string,
  rawData: unknown
): Promise<ActionResult<Task>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!taskId) return { success: false, error: "Task ID is required" };

  const parsed = updateTaskSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((err) => {
      const key = err.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(err.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  try {
    // IDOR protection: verify user owns task or is admin/owner
    const existingTask = await db.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { creatorId: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ["OWNER"] },
                },
              },
            },
          },
        ],
      },
    });

    if (!existingTask) {
      return { success: false, error: "Task not found or access denied" };
    }

    const { dueDate, categoryId, assigneeId, teamId, ...rest } = parsed.data;

    const updateData: Prisma.TaskUpdateInput = {
      ...rest,
    };

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (categoryId !== undefined) {
      updateData.category = categoryId
        ? { connect: { id: categoryId } }
        : { disconnect: true };
    }
    if (assigneeId !== undefined) {
      updateData.assignee = assigneeId
        ? { connect: { id: assigneeId } }
        : { disconnect: true };
    }

    const task = await db.task.update({
      where: { id: taskId },
      data: updateData,
    });

    revalidatePath("/tasks");
    return { success: true, data: task, message: "Task updated successfully" };
  } catch (error) {
    console.error("updateTask error:", error);
    return { success: false, error: "Failed to update task" };
  }
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!taskId) return { success: false, error: "Task ID is required" };

  try {
    // IDOR protection: verify user owns task or is team owner
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { creatorId: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ["OWNER"] },
                },
              },
            },
          },
        ],
      },
    });

    if (!task) {
      return { success: false, error: "Task not found or access denied" };
    }

    await db.task.delete({ where: { id: taskId } });

    revalidatePath("/tasks");
    return { success: true, message: "Task deleted successfully" };
  } catch (error) {
    console.error("deleteTask error:", error);
    return { success: false, error: "Failed to delete task" };
  }
}

export async function toggleTaskStatus(
  taskId: string,
  newStatus: TaskStatus
): Promise<ActionResult<Task>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // IDOR protection
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { creatorId: session.user.id },
          { assigneeId: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ["OWNER", "MEMBER"] },
                },
              },
            },
          },
        ],
      },
    });

    if (!task) {
      return { success: false, error: "Task not found or access denied" };
    }

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    revalidatePath("/tasks");
    return { success: true, data: updatedTask };
  } catch (error) {
    console.error("toggleTaskStatus error:", error);
    return { success: false, error: "Failed to update task status" };
  }
}
