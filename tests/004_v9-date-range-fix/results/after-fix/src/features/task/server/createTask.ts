"use server";

import { prisma } from "@/lib/prisma";
import { CreateTaskSchema, type CreateTaskInput } from "../schema/createTaskSchema";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createTask(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = CreateTaskSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<
      string,
      string[]
    >;
    return {
      success: false,
      error: "Validation failed",
      fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        categoryId: data.categoryId,
      },
      select: { id: true },
    });

    return { success: true, data: { id: task.id } };
  } catch (err) {
    console.error("createTask error:", err);
    return { success: false, error: "Failed to create task" };
  }
}
