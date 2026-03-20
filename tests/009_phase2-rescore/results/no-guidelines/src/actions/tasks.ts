"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations/task";
import { actionSuccess, actionError } from "@/lib/api-response";
import { TaskPriority, TaskStatus, TeamRole } from "@prisma/client";

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

async function canModifyTask(taskId: string, userId: string) {
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

  if (!task) return { allowed: false, task: null };

  if (task.creatorId === userId) return { allowed: true, task };

  if (task.team) {
    const member = task.team.members[0];
    if (member && (member.role === TeamRole.OWNER || member.role === TeamRole.MEMBER)) {
      // Only owner can delete any task; members can only edit own tasks
      return { allowed: member.role === TeamRole.OWNER, task };
    }
  }

  return { allowed: false, task };
}

export async function createTaskAction(formData: FormData) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || TaskStatus.TODO,
    priority: formData.get("priority") || TaskPriority.MEDIUM,
    dueDate: formData.get("dueDate") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    teamId: formData.get("teamId") || undefined,
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { teamId, ...rest } = parsed.data;

  // Verify team membership if teamId provided
  if (teamId) {
    const member = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!member || member.role === TeamRole.VIEWER) {
      return actionError("Insufficient permissions to create tasks in this team");
    }
  }

  const task = await db.task.create({
    data: {
      ...rest,
      dueDate: rest.dueDate ? new Date(rest.dueDate) : null,
      creatorId: session.user.id,
      teamId: teamId ?? null,
    },
  });

  revalidatePath("/tasks");
  if (teamId) revalidatePath(`/teams/${teamId}`);

  return actionSuccess(task);
}

export async function updateTaskAction(taskId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const { allowed, task } = await canModifyTask(taskId, session.user.id);
  if (!allowed || !task) return actionError("Insufficient permissions");

  const raw = {
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
  };

  const parsed = updateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const updated = await db.task.update({
    where: { id: taskId },
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);

  return actionSuccess(updated);
}

export async function toggleTaskStatusAction(taskId: string, newStatus: TaskStatus, updatedAt: Date) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  // Optimistic concurrency check via updatedAt
  const task = await db.task.findFirst({
    where: { id: taskId, updatedAt },
  });

  if (!task) {
    return actionError("Task was modified by someone else. Please refresh.");
  }

  const canEdit =
    task.creatorId === session.user.id ||
    (task.teamId &&
      (await db.teamMember.findFirst({
        where: {
          teamId: task.teamId,
          userId: session.user.id,
          role: { in: [TeamRole.OWNER, TeamRole.MEMBER] },
        },
      })));

  if (!canEdit) return actionError("Insufficient permissions");

  const updated = await db.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });

  revalidatePath("/tasks");

  return actionSuccess(updated);
}

export async function deleteTaskAction(taskId: string) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      team: { include: { members: { where: { userId: session.user.id } } } },
    },
  });

  if (!task) return actionError("Task not found");

  const isCreator = task.creatorId === session.user.id;
  const isTeamAdmin =
    task.team?.members[0]?.role === TeamRole.OWNER;

  if (!isCreator && !isTeamAdmin) {
    return actionError("Insufficient permissions");
  }

  await db.task.delete({ where: { id: taskId } });

  revalidatePath("/tasks");
  if (task.teamId) revalidatePath(`/teams/${task.teamId}`);

  return actionSuccess(undefined);
}
