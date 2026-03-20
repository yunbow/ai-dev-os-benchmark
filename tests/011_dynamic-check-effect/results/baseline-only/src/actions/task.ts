"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations/task";
import type { ActionResult, TaskWithRelations } from "@/types";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations/task";
import { TeamRole } from "@prisma/client";
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
  creator: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  category: { select: { id: true, name: true, color: true } },
  team: { select: { id: true, name: true } },
} as const;

async function getTeamRole(userId: string, teamId: string): Promise<TeamRole | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { ownerId: true },
  });
  if (!team) return null;
  if (team.ownerId === userId) return TeamRole.OWNER;

  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });
  return member?.role ?? null;
}

export async function createTaskAction(
  data: CreateTaskInput
): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = createTaskSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { teamId, categoryId, assigneeId, ...taskData } = parsed.data;

  // If task belongs to a team, verify membership
  if (teamId) {
    const role = await getTeamRole(session.user.id, teamId);
    if (!role || role === TeamRole.VIEWER) {
      return { success: false, error: "You don't have permission to create tasks in this team" };
    }
  }

  const task = await prisma.task.create({
    data: {
      ...taskData,
      creatorId: session.user.id,
      teamId: teamId ?? null,
      categoryId: categoryId ?? null,
      assigneeId: assigneeId ?? null,
    },
    select: taskSelect,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, data: task as unknown as TaskWithRelations };
}

export async function updateTaskAction(
  id: string,
  data: UpdateTaskInput
): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = updateTaskSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const existing = await prisma.task.findUnique({
    where: { id },
    select: { creatorId: true, teamId: true, updatedAt: true },
  });

  if (!existing) {
    return { success: false, error: "Task not found" };
  }

  // Check permissions: creator or team admin/owner
  let canEdit = existing.creatorId === session.user.id;
  if (!canEdit && existing.teamId) {
    const role = await getTeamRole(session.user.id, existing.teamId);
    canEdit = role === TeamRole.OWNER;
  }

  if (!canEdit) {
    return { success: false, error: "You don't have permission to edit this task" };
  }

  // Optimistic concurrency check
  if (parsed.data.updatedAt && existing.updatedAt > parsed.data.updatedAt) {
    return {
      success: false,
      error: "This task was modified by someone else. Please refresh and try again.",
    };
  }

  const { updatedAt, ...updateData } = parsed.data;

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
    select: taskSelect,
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/dashboard");
  return { success: true, data: task as unknown as TaskWithRelations };
}

export async function deleteTaskAction(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const existing = await prisma.task.findUnique({
    where: { id },
    select: { creatorId: true, teamId: true },
  });

  if (!existing) {
    return { success: false, error: "Task not found" };
  }

  let canDelete = existing.creatorId === session.user.id;
  if (!canDelete && existing.teamId) {
    const role = await getTeamRole(session.user.id, existing.teamId);
    canDelete = role === TeamRole.OWNER;
  }

  if (!canDelete) {
    return { success: false, error: "You don't have permission to delete this task" };
  }

  await prisma.task.delete({ where: { id } });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function toggleTaskStatusAction(
  id: string,
  currentUpdatedAt: Date
): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const existing = await prisma.task.findUnique({
    where: { id },
    select: { status: true, creatorId: true, teamId: true, updatedAt: true, assigneeId: true },
  });

  if (!existing) {
    return { success: false, error: "Task not found" };
  }

  // Check permissions
  let canEdit =
    existing.creatorId === session.user.id || existing.assigneeId === session.user.id;

  if (!canEdit && existing.teamId) {
    const role = await getTeamRole(session.user.id, existing.teamId);
    canEdit = role !== null && role !== TeamRole.VIEWER;
  }

  if (!canEdit) {
    return { success: false, error: "You don't have permission to update this task" };
  }

  // Optimistic concurrency check
  if (existing.updatedAt > currentUpdatedAt) {
    return {
      success: false,
      error: "This task was modified by someone else. Please refresh and try again.",
    };
  }

  const nextStatus =
    existing.status === "TODO"
      ? "IN_PROGRESS"
      : existing.status === "IN_PROGRESS"
        ? "DONE"
        : "TODO";

  const task = await prisma.task.update({
    where: { id },
    data: { status: nextStatus },
    select: taskSelect,
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/dashboard");
  return { success: true, data: task as unknown as TaskWithRelations };
}
