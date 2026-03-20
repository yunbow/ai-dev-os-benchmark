"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireTaskOwnership } from "@/lib/actions/auth-helpers";
import {
  ActionResult,
  createActionSuccess,
  createActionError,
} from "@/types";
import type { Task } from "@prisma/client";
import { revalidatePath } from "next/cache";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      { message: "Due date must be in the future" },
    ),
  teamId: z.string().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

export async function getUserTasks(): Promise<ActionResult<Task[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return createActionError(authResult.error);

  // Filter by userId in WHERE clause — only return the user's own tasks
  const tasks = await prisma.task.findMany({
    where: { userId: authResult.user.id },
    orderBy: { createdAt: "desc" },
  });

  return createActionSuccess(tasks);
}

export async function getTask(taskId: string): Promise<ActionResult<Task>> {
  // IDOR prevention: verify ownership before returning task
  const ownershipResult = await requireTaskOwnership(taskId);
  if (!ownershipResult.success) return createActionError(ownershipResult.error);

  return createActionSuccess(ownershipResult.task);
}

export async function createTask(
  formData: FormData,
): Promise<ActionResult<Task>> {
  const authResult = await requireAuth();
  if (!authResult.success) return createActionError(authResult.error);

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || "todo",
    priority: formData.get("priority") || "medium",
    dueDate: formData.get("dueDate") || undefined,
    teamId: formData.get("teamId") || undefined,
  });

  if (!parsed.success) {
    return createActionError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const { title, description, status, priority, dueDate, teamId } = parsed.data;

  // If teamId provided, verify the user is a member of that team
  if (teamId) {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId: authResult.user.id },
    });
    const isOwner = await prisma.team.findFirst({
      where: { id: teamId, ownerId: authResult.user.id },
    });
    if (!membership && !isOwner) {
      return createActionError("You are not a member of this team");
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: authResult.user.id,
      teamId: teamId ?? null,
    },
  });

  revalidatePath("/tasks");
  return createActionSuccess(task);
}

export async function updateTask(
  taskId: string,
  formData: FormData,
): Promise<ActionResult<Task>> {
  // IDOR prevention: verify ownership before updating
  const ownershipResult = await requireTaskOwnership(taskId);
  if (!ownershipResult.success) return createActionError(ownershipResult.error);

  const parsed = updateTaskSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    return createActionError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
  });

  revalidatePath("/tasks");
  return createActionSuccess(task);
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  // IDOR prevention: verify ownership before deleting
  const ownershipResult = await requireTaskOwnership(taskId);
  if (!ownershipResult.success) return createActionError(ownershipResult.error);

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath("/tasks");
  return createActionSuccess();
}
