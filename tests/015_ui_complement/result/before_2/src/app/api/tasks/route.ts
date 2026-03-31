import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";

export async function GET() {
  const allTasks = await db.select().from(tasks);
  return NextResponse.json(allTasks);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const [created] = await db
    .insert(tasks)
    .values({
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? "todo",
      dueDate: body.dueDate ?? null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
