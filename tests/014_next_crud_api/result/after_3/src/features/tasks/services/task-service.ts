import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import type { CreateTaskInput, UpdateTaskInput } from "../schema";

export async function listTasks() {
  return db.select().from(tasks).orderBy(tasks.createdAt);
}

export async function getTask(id: string) {
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createTask(input: CreateTaskInput) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const [task] = await db
    .insert(tasks)
    .values({ id, createdAt, ...input })
    .returning();
  return task;
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const [task] = await db
    .update(tasks)
    .set(input)
    .where(eq(tasks.id, id))
    .returning();
  return task ?? null;
}

export async function deleteTask(id: string) {
  const [task] = await db
    .delete(tasks)
    .where(eq(tasks.id, id))
    .returning();
  return task ?? null;
}
