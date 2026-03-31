import { NextResponse } from "next/server";
import { createTaskSchema } from "@/features/tasks/schema";
import * as taskService from "@/features/tasks/service";

export async function GET() {
  const tasks = await taskService.findAll();
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const task = await taskService.create(parsed.data);
  return NextResponse.json(task, { status: 201 });
}
