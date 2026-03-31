import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";

export async function GET() {
  const all = await db.select().from(tasks);
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, status, dueDate } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const inserted = await db
    .insert(tasks)
    .values({ title, description, status, dueDate })
    .returning();

  return NextResponse.json(inserted[0], { status: 201 });
}
