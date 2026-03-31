import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { updateTaskSchema } from "@/features/tasks/schema";

type Params = { params: Promise<{ id: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidId(id: string): boolean {
  return UUID_RE.test(id);
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json(task);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(tasks)
    .set(parsed.data)
    .where(eq(tasks.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }
  const [deleted] = await db
    .delete(tasks)
    .where(eq(tasks.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
