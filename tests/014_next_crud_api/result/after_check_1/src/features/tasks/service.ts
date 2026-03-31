import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import type { CreateTaskInput, UpdateTaskInput } from "./schema";

export async function findAll() {
  return db.select().from(tasks);
}

export async function findById(id: number) {
  const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function create(input: CreateTaskInput) {
  const rows = await db.insert(tasks).values(input).returning();
  return rows[0];
}

export async function update(id: number, input: UpdateTaskInput) {
  const rows = await db
    .update(tasks)
    .set(input)
    .where(eq(tasks.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function remove(id: number) {
  const rows = await db.delete(tasks).where(eq(tasks.id, id)).returning();
  return rows[0] ?? null;
}
