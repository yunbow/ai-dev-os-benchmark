import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(id)));

  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(task);
}

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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(task);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const [task] = await db
    .delete(tasks)
    .where(eq(tasks.id, Number(id)))
    .returning();

  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
