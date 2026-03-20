"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations/task";
import type { ActionResult } from "@/types";
import { Task, TaskStatus, TeamRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

async function assertTaskPermission(taskId: string, userId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      team: {
        include: {
          members: { where: { userId } },
        },
      },
    },
  });

  if (!task) throw new Error("Task not found");

  // Creator can always modify
  if (task.creatorId === userId) return task;

  // Team admin/owner can modify
  if (task.team) {
    const member = task.team.members[0];
    if (member && (member.role === TeamRole.OWNER || member.role === TeamRole.MEMBER)) return task;
  }

  throw new Error("Forbidden: insufficient permissions");
}

export async function createTask(formData: FormData): Promise<ActionResult<Task>> {
  const userId = await getAuthenticatedUserId();

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    teamId: formData.get("teamId") || undefined,
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    // Verify team membership if teamId provided
    if (parsed.data.teamId) {
      const member = await db.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId: parsed.data.teamId } },
      });
      if (!member || member.role === TeamRole.VIEWER) {
        return { success: false, error: "Forbidden: insufficient team permissions" };
      }
    }

    const task = await db.task.create({
      data: {
        ...parsed.data,
        creatorId: userId,
        dueDate: parsed.data.dueDate ?? null,
        categoryId: parsed.data.categoryId ?? null,
        assigneeId: parsed.data.assigneeId ?? null,
        teamId: parsed.data.teamId ?? null,
      },
    });

    revalidatePath("/tasks");
    return { success: true, data: task };
  } catch (err) {
    console.error("createTask DB error:", err);
    return { success: false, error: "Failed to create task. Please try again." };
  }
}

export async function updateTask(
  taskId: string,
  formData: FormData
): Promise<ActionResult<Task>> {
  const userId = await getAuthenticatedUserId();

  try {
    await assertTaskPermission(taskId, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return { success: false, error: message };
  }

  const raw = {
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    updatedAt: formData.get("updatedAt") || undefined,
  };

  const parsed = updateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { updatedAt: clientUpdatedAt, ...updateData } = parsed.data;

  try {
    // Optimistic concurrency check
    if (clientUpdatedAt) {
      const existing = await db.task.findUnique({ where: { id: taskId }, select: { updatedAt: true } });
      if (existing && existing.updatedAt.getTime() !== clientUpdatedAt.getTime()) {
        return { success: false, error: "Task was modified by another user. Please refresh." };
      }
    }

    const task = await db.task.update({
      where: { id: taskId },
      data: updateData,
    });

    revalidatePath("/tasks");
    return { success: true, data: task };
  } catch (err) {
    console.error("updateTask DB error:", err);
    return { success: false, error: "Failed to update task. Please try again." };
  }
}

export async function toggleTaskStatus(
  taskId: string,
  newStatus: TaskStatus
): Promise<ActionResult<Task>> {
  const userId = await getAuthenticatedUserId();

  try {
    await assertTaskPermission(taskId, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return { success: false, error: message };
  }

  try {
    const task = await db.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    revalidatePath("/tasks");
    return { success: true, data: task };
  } catch (err) {
    console.error("toggleTaskStatus DB error:", err);
    return { success: false, error: "Failed to update task status. Please try again." };
  }
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();

  try {
    await assertTaskPermission(taskId, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return { success: false, error: message };
  }

  try {
    await db.task.delete({ where: { id: taskId } });
    revalidatePath("/tasks");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("deleteTask DB error:", err);
    return { success: false, error: "Failed to delete task. Please try again." };
  }
}
