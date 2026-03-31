"use server";

import { revalidatePath } from "next/cache";
import { createTaskSchema } from "../schema/task.schema";
import { createTask } from "../services/task.service";

export type ActionResult =
  | { success: true }
  | { success: false; errors: Record<string, string[]> };

export async function createTaskAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  createTask(parsed.data);
  revalidatePath("/dashboard/tasks");
  return { success: true };
}
