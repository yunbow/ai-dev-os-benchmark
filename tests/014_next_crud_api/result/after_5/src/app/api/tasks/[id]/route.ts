import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { updateTaskSchema } from "@/features/tasks/schema/task.schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const task = db.select().from(tasks).where(eq(tasks.id, id)).get();

  if (!task) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Task not found" } },
      { status: 404 }
    );
  }

  return Response.json(task);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: { code: "BAD_REQUEST", message: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const [task] = db
    .update(tasks)
    .set(parsed.data)
    .where(eq(tasks.id, id))
    .returning()
    .all();

  if (!task) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Task not found" } },
      { status: 404 }
    );
  }

  return Response.json(task);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const [task] = db.delete(tasks).where(eq(tasks.id, id)).returning().all();

  if (!task) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Task not found" } },
      { status: 404 }
    );
  }

  return new Response(null, { status: 204 });
}
