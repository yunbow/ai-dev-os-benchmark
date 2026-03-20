"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/validations/task";
import * as taskService from "@/lib/services/task.service";
import type { ActionResult } from "@/types";

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function createTask(formData: FormData): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || "TODO",
    priority: formData.get("priority") || "MEDIUM",
    dueDate: formData.get("dueDate") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    teamId: formData.get("teamId") || undefined,
  };

  const parsed = CreateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const task = await taskService.createTask(parsed.data, userId);
    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    return { success: true, data: task };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "FORBIDDEN") return { success: false, error: "Access denied" };
    return { success: false, error: "Failed to create task" };
  }
}

export async function updateTask(id: string, formData: FormData): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const raw = {
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
  };

  const parsed = UpdateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const task = await taskService.updateTask(id, parsed.data, userId);
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: task };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_FOUND") return { success: false, error: "Task not found" };
    if (message === "FORBIDDEN") return { success: false, error: "Access denied" };
    return { success: false, error: "Failed to update task" };
  }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  try {
    await taskService.deleteTask(id, userId);
    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_FOUND") return { success: false, error: "Task not found" };
    if (message === "FORBIDDEN") return { success: false, error: "Access denied" };
    return { success: false, error: "Failed to delete task" };
  }
}
