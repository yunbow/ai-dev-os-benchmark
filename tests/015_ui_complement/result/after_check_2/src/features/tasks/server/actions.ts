"use server";

import { revalidatePath } from "next/cache";
import { createTaskSchema } from "../schema/task";
import { createTask } from "../services/task-service";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createTaskAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || "todo",
  };

  // サーバーサイドバリデーション（validation.md: Client + Server 両方で同一スキーマ）
  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<
      string,
      string[]
    >;
    return { success: false, error: "入力値が不正です", fieldErrors };
  }

  const task = await createTask(parsed.data);
  revalidatePath("/dashboard/tasks");

  return { success: true, data: { id: task.id } };
}
