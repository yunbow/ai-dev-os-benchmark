import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { createTaskSchema } from "@/features/tasks/schema/task.schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = db.select().from(tasks).all();
  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: { code: "BAD_REQUEST", message: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const [task] = db.insert(tasks).values(parsed.data).returning().all();
  return Response.json(task, { status: 201 });
}
