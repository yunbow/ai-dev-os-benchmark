import { NextResponse } from "next/server";
import { updateTaskSchema } from "@/features/tasks/schema";
import * as taskService from "@/features/tasks/service";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_req: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid id" } }, { status: 400 });

  const task = await taskService.findById(id);
  if (!task) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });

  return NextResponse.json(task);
}

export async function PUT(request: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid id" } }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const task = await taskService.update(id, parsed.data);
  if (!task) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });

  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid id" } }, { status: 400 });

  const task = await taskService.remove(id);
  if (!task) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 });

  return NextResponse.json(task);
}
