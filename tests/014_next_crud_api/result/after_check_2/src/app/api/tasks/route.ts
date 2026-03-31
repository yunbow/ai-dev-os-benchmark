import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { createTaskSchema } from "@/features/tasks/schema";

export async function GET() {
  const allTasks = await db.select().from(tasks);
  return NextResponse.json(allTasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, description, status, dueDate } = parsed.data;
  const [created] = await db
    .insert(tasks)
    .values({
      id: crypto.randomUUID(),
      title,
      description: description ?? null,
      status,
      dueDate: dueDate ?? null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
