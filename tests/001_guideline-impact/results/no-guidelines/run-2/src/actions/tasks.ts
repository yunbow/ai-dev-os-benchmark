"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, updateTaskSchema } from "@/validations/task";
import type { ActionResult, TaskWithRelations } from "@/types";
import { revalidatePath } from "next/cache";

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  creatorId: true,
  assigneeId: true,
  categoryId: true,
  teamId: true,
  creator: { select: { id: true, name: true, email: true, image: true } },
  assignee: { select: { id: true, name: true, email: true, image: true } },
  category: { select: { id: true, name: true, color: true } },
} as const;

export async function createTask(
  formData: FormData
): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

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
    const details: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".") || "root";
      details[key] = [...(details[key] ?? []), e.message];
    });
    return { success: false, error: "Validation failed", details };
  }

  const { teamId, assigneeId, categoryId, ...rest } = parsed.data;

  // Verify team membership if teamId provided
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: session.user.id, teamId } },
    });
    if (!membership || membership.role === "VIEWER") {
      return { success: false, error: "Insufficient permissions to create tasks in this team" };
    }
  }

  const task = await prisma.task.create({
    data: {
      ...rest,
      creatorId: session.user.id,
      teamId: teamId ?? null,
      assigneeId: assigneeId ?? null,
      categoryId: categoryId ?? null,
    },
    select: taskSelect,
  });

  revalidatePath("/dashboard/tasks");
  return { success: true, data: task as TaskWithRelations };
}

export async function updateTask(
  id: string,
  formData: FormData
): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return { success: false, error: "Task not found" };

  // Check ownership or team admin
  const canEdit = await canModifyTask(session.user.id, task);
  if (!canEdit) return { success: false, error: "Insufficient permissions" };

  const raw = Object.fromEntries(
    Array.from(formData.entries()).map(([k, v]) => [k, v === "" ? undefined : v])
  );

  const parsed = updateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".") || "root";
      details[key] = [...(details[key] ?? []), e.message];
    });
    return { success: false, error: "Validation failed", details };
  }

  const updated = await prisma.task.update({
    where: { id },
    data: parsed.data,
    select: taskSelect,
  });

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${id}`);
  return { success: true, data: updated as TaskWithRelations };
}

export async function deleteTask(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return { success: false, error: "Task not found" };

  const canEdit = await canModifyTask(session.user.id, task);
  if (!canEdit) return { success: false, error: "Insufficient permissions" };

  await prisma.task.delete({ where: { id } });
  revalidatePath("/dashboard/tasks");
  return { success: true, data: undefined };
}

export async function toggleTaskStatus(
  id: string,
  updatedAt: string
): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return { success: false, error: "Task not found" };

  // Optimistic concurrency check
  if (task.updatedAt.toISOString() !== updatedAt) {
    return { success: false, error: "Task was modified by another user. Please refresh." };
  }

  const canEdit = await canModifyTask(session.user.id, task);
  if (!canEdit) return { success: false, error: "Insufficient permissions" };

  const nextStatus = {
    TODO: "IN_PROGRESS" as const,
    IN_PROGRESS: "DONE" as const,
    DONE: "TODO" as const,
  }[task.status];

  const updated = await prisma.task.update({
    where: { id },
    data: { status: nextStatus },
    select: taskSelect,
  });

  revalidatePath("/dashboard/tasks");
  return { success: true, data: updated as TaskWithRelations };
}

async function canModifyTask(
  userId: string,
  task: { creatorId: string; teamId: string | null }
): Promise<boolean> {
  if (task.creatorId === userId) return true;

  if (task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: task.teamId } },
    });
    return membership?.role === "OWNER";
  }

  return false;
}
