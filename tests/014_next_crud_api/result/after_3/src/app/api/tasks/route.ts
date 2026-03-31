import { NextResponse } from "next/server";
import { CreateTaskSchema } from "@/features/tasks/schema";
import { createTask, listTasks } from "@/features/tasks/services/task-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await listTasks();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.flatten() } },
      { status: 422 }
    );
  }

  const task = await createTask(parsed.data);
  return NextResponse.json(task, { status: 201 });
}
