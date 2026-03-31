import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tasks } from '@/lib/db/schema'
import { updateTaskSchema } from '@/features/tasks/schema'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const rows = await db.select().from(tasks).where(eq(tasks.id, id))
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(rows[0])
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateTaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const existing = await db.select().from(tasks).where(eq(tasks.id, id))
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const update: Partial<typeof existing[0]> = {}
  if (parsed.data.title       !== undefined) update.title       = parsed.data.title
  if (parsed.data.description !== undefined) update.description = parsed.data.description
  if (parsed.data.status      !== undefined) update.status      = parsed.data.status
  if (parsed.data.dueDate     !== undefined) update.dueDate     = parsed.data.dueDate

  await db.update(tasks).set(update).where(eq(tasks.id, id))

  const updated = await db.select().from(tasks).where(eq(tasks.id, id))
  return NextResponse.json(updated[0])
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const existing = await db.select().from(tasks).where(eq(tasks.id, id))
  if (existing.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.delete(tasks).where(eq(tasks.id, id))
  return new NextResponse(null, { status: 204 })
}
