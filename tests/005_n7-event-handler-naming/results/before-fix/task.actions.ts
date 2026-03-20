"use server";

import { revalidatePath } from "next/cache";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export async function toggleTaskStatus(
  id: string,
  nextStatus: TaskStatus
): Promise<void> {
  // TODO: update task status in the database
  // e.g. await db.task.update({ where: { id }, data: { status: nextStatus } });
  revalidatePath("/tasks");
}

export async function deleteTask(id: string): Promise<void> {
  // TODO: delete task from the database
  // e.g. await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
}
