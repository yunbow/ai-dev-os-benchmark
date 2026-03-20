import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ─── Input validation schema ────────────────────────────────────────────────

const TaskStatus = z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]);
const TaskPriority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const searchQuerySchema = z.object({
  search: z.string().max(200).optional(),
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

// ─── Response helpers ────────────────────────────────────────────────────────

function jsonOk<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

function jsonError(
  status: number,
  code: string,
  message: string
): NextResponse {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

// ─── GET /api/v1/tasks ───────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError(401, "UNAUTHORIZED", "Authentication required.");
  }
  const userId = session.user.id;

  // 2. Rate limiting — api preset: 100 req/min per user
  const { success: withinLimit } = await checkRateLimit(`api:tasks:${userId}`, {
    maxRequests: 100,
    windowMs: 60_000,
  });
  if (!withinLimit) {
    return jsonError(429, "TOO_MANY_REQUESTS", "Rate limit exceeded. Please try again later.");
  }

  // 3. Parse & validate query parameters
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = searchQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Invalid query parameters.");
  }
  const { search, status, priority, cursor, limit } = parsed.data;

  // 4. Build Prisma where clause
  //    IDOR prevention: always scope to the authenticated user's tasks.
  const where: Prisma.TaskWhereInput = {
    userId, // ← ownership filter — never omit this
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // 5. Cursor-based pagination
  //    Fetch limit+1 to determine whether a next page exists.
  const take = limit + 1;
  const cursorClause: Prisma.TaskFindManyArgs["cursor"] = cursor
    ? { id: cursor }
    : undefined;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    ...(cursorClause ? { cursor: cursorClause, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const hasNextPage = tasks.length === take;
  const items = hasNextPage ? tasks.slice(0, limit) : tasks;
  const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

  return jsonOk(items, {
    limit,
    nextCursor,
    hasNextPage,
  });
}
