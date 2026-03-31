import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { createTaskSchema } from '@/features/tasks/schema'
import { randomUUID } from 'crypto'

export async function GET() {
  const rows = await db.select().from(tasks)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const now = new Date().toISOString()
  const task = {
    id:          randomUUID(),
    title:       parsed.data.title,
    description: parsed.data.description ?? null,
    status:      parsed.data.status,
    dueDate:     parsed.data.dueDate ?? null,
    createdAt:   now,
  }

  await db.insert(tasks).values(task)
  return NextResponse.json(task, { status: 201 })
}
