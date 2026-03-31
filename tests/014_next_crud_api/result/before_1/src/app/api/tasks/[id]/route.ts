import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/tasks/[id] - 詳細取得
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(id)));

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json(task);
}

// PUT /api/tasks/[id] - 更新
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, status, dueDate } = body;

  const [task] = await db
    .update(tasks)
    .set({ title, description, status, dueDate })
    .where(eq(tasks.id, Number(id)))
    .returning();

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json(task);
}

// DELETE /api/tasks/[id] - 削除
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const [task] = await db
    .delete(tasks)
    .where(eq(tasks.id, Number(id)))
    .returning();

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Deleted" });
}
