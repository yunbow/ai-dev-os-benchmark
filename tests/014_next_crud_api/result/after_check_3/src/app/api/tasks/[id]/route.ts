import { NextResponse } from "next/server";
import { UpdateTaskSchema } from "@/features/tasks/schema";
import {
  getTask,
  updateTask,
  deleteTask,
} from "@/features/tasks/services/task-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Task not found" } },
      { status: 404 }
    );
  }
  return NextResponse.json(task);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.flatten() } },
      { status: 422 }
    );
  }

  const task = await updateTask(id, parsed.data);
  if (!task) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Task not found" } },
      { status: 404 }
    );
  }
  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const task = await deleteTask(id);
  if (!task) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Task not found" } },
      { status: 404 }
    );
  }
  return new Response(null, { status: 204 });
}
