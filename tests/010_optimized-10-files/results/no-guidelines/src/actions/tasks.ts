"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskSchema, updateTaskSchema, toggleTaskStatusSchema } from "@/lib/validations";
import type { ActionResult } from "@/actions/auth";
import type { Task } from "@prisma/client";

type TaskWithRelations = Task & {
  category: { id: string; name: string; color: string } | null;
  assignee: { id: string; name: string | null; email: string; image: string | null } | null;
  creator: { id: string; name: string | null; email: string; image: string | null };
  team: { id: string; name: string } | null;
};

async function checkTaskWritePermission(
  taskId: string,
  userId: string
): Promise<{ allowed: boolean; task: Task | null }> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      team: {
        include: {
          members: {
            where: { userId },
            select: { role: true },
          },
        },
      },
    },
  });

  if (!task) return { allowed: false, task: null };

  const teamMember = (task as Task & { team: { members: { role: string }[] } | null }).team?.members[0];
  const isCreator = task.creatorId === userId;
  const isTeamAdmin =
    teamMember?.role === "OWNER" || teamMember?.role === "MEMBER";

  return { allowed: isCreator || isTeamAdmin, task };
}

export async function createTask(data: unknown): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;
  const parsed = taskSchema.safeParse(data);

  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      if (!details[field]) details[field] = [];
      details[field].push(issue.message);
    });
    return { success: false, error: "Validation failed", details };
  }

  const { teamId, categoryId, assigneeId, ...rest } = parsed.data;

  // Verify team membership if teamId provided
  if (teamId) {
    const member = await db.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!member) {
      return { success: false, error: "You are not a member of this team." };
    }
  }

  const task = await db.task.create({
    data: {
      ...rest,
      creatorId: userId,
      teamId: teamId ?? null,
      categoryId: categoryId ?? null,
      assigneeId: assigneeId ?? null,
    },
    include: {
      category: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true, image: true } },
      creator: { select: { id: true, name: true, email: true, image: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return { success: true, data: task as TaskWithRelations };
}

export async function updateTask(
  id: string,
  data: unknown
): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;
  const { allowed, task } = await checkTaskWritePermission(id, userId);

  if (!task) {
    return { success: false, error: "Task not found." };
  }

  if (!allowed) {
    return { success: false, error: "You do not have permission to update this task." };
  }

  const parsed = updateTaskSchema.safeParse(data);
  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      if (!details[field]) details[field] = [];
      details[field].push(issue.message);
    });
    return { success: false, error: "Validation failed", details };
  }

  const { updatedAt, ...updateData } = parsed.data;

  // Optimistic concurrency check
  if (updatedAt) {
    const clientUpdatedAt = new Date(updatedAt);
    if (task.updatedAt.getTime() !== clientUpdatedAt.getTime()) {
      return {
        success: false,
        error: "Task was modified by another user. Please refresh and try again.",
      };
    }
  }

  const updated = await db.task.update({
    where: { id },
    data: updateData,
    include: {
      category: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true, image: true } },
      creator: { select: { id: true, name: true, email: true, image: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return { success: true, data: updated as TaskWithRelations };
}

export async function deleteTask(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;
  const { allowed, task } = await checkTaskWritePermission(id, userId);

  if (!task) {
    return { success: false, error: "Task not found." };
  }

  if (!allowed) {
    return { success: false, error: "You do not have permission to delete this task." };
  }

  await db.task.delete({ where: { id } });

  return { success: true, data: { id } };
}

export async function toggleTaskStatus(
  id: string,
  status: string,
  updatedAt: string
): Promise<ActionResult<TaskWithRelations>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;

  const parsed = toggleTaskStatusSchema.safeParse({ status, updatedAt });
  if (!parsed.success) {
    return { success: false, error: "Invalid status or updatedAt value." };
  }

  const { allowed, task } = await checkTaskWritePermission(id, userId);

  if (!task) {
    return { success: false, error: "Task not found." };
  }

  if (!allowed) {
    return { success: false, error: "You do not have permission to update this task." };
  }

  // Optimistic concurrency check
  const clientUpdatedAt = new Date(parsed.data.updatedAt);
  if (task.updatedAt.getTime() !== clientUpdatedAt.getTime()) {
    return {
      success: false,
      error: "Task was modified by another user. Please refresh and try again.",
    };
  }

  const updated = await db.task.update({
    where: { id },
    data: { status: parsed.data.status },
    include: {
      category: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true, image: true } },
      creator: { select: { id: true, name: true, email: true, image: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return { success: true, data: updated as TaskWithRelations };
}
