"use server";

import { CreateTaskSchema } from "../schema/task-schema";
import type { ActionResult, Task } from "../types";

// 最小構成: インメモリストア（本番では Prisma に置き換える）
const taskStore: Task[] = [];

export async function getTasks(): Promise<Task[]> {
  return [...taskStore];
}

export async function createTask(input: unknown): Promise<ActionResult<Task>> {
  const parsed = CreateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容に誤りがあります",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  const task: Task = {
    id: crypto.randomUUID(),
    title: parsed.data.title,
    description: parsed.data.description,
    createdAt: new Date(),
  };

  taskStore.push(task);

  return { success: true, data: task };
}
