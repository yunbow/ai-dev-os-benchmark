import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const task = await db.select().from(tasks).where(eq(tasks.id, Number(id)));

  if (!task.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(task[0]);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, status, dueDate } = body;

  const updated = await db
    .update(tasks)
    .set({ title, description, status, dueDate })
    .where(eq(tasks.id, Number(id)))
    .returning();

  if (!updated.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const deleted = await db
    .delete(tasks)
    .where(eq(tasks.id, Number(id)))
    .returning();

  if (!deleted.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ message: "Deleted" });
}
