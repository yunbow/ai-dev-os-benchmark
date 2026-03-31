import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const [task] = await db.select().from(tasks).where(eq(tasks.id, Number(id)));
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const [existing] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, Number(id)));
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await db
    .update(tasks)
    .set({
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      status: body.status ?? existing.status,
      dueDate: body.dueDate ?? existing.dueDate,
    })
    .where(eq(tasks.id, Number(id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const [existing] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, Number(id)));
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(tasks).where(eq(tasks.id, Number(id)));
  return new NextResponse(null, { status: 204 });
}
