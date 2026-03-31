"use server";

import { revalidatePath } from "next/cache";
import { ActionResult } from "@/lib/actions/action-helpers";
import { CreateTaskSchema } from "../schema/task-schema";
import { createTask } from "../services/task-service";
import { Task } from "../types/task";

export async function createTaskAction(
  input: unknown
): Promise<ActionResult<Task>> {
  const parsed = CreateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力値が不正です",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const task = await createTask(parsed.data);
    revalidatePath("/dashboard/tasks");
    return { success: true, data: task };
  } catch {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "タスクの作成に失敗しました" },
    };
  }
}
