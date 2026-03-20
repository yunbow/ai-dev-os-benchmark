"use server";

import { prisma } from "@/lib/prisma";
import { CreateTaskSchema, type CreateTaskInput } from "../schema/createTask";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createTask(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = CreateTaskSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const data = parsed.data;

  // Validate dueDate is in the future
  if (data.dueDate && data.dueDate <= new Date()) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: { dueDate: ["Due date must be a future date"] },
    };
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate,
        categoryId: data.categoryId,
      },
      select: { id: true },
    });

    return { success: true, data: { id: task.id } };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "Failed to create task. Please try again." };
  }
}
