import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Input validation schema
// ---------------------------------------------------------------------------

const TaskStatus = z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]);
const TaskPriority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const searchParamsSchema = z.object({
  search: z.string().max(200).optional(),
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const n = val ? parseInt(val, 10) : 20;
      return Number.isNaN(n) ? 20 : Math.min(Math.max(n, 1), 100);
    }),
});

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function successResponse<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ success: true, data, meta: meta ?? null });
}

function errorResponse(
  message: string,
  status: number,
  code?: string
): NextResponse {
  return NextResponse.json(
    { success: false, error: { message, code: code ?? "ERROR" } },
    { status }
  );
}

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, single-instance dev; swap for Upstash in prod)
// ---------------------------------------------------------------------------

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // api preset: 100/min
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

// ---------------------------------------------------------------------------
// GET /api/v1/tasks
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── 1. Authentication ────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
  }
  const userId = session.user.id;

  // ── 2. Rate limiting ─────────────────────────────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    const res = errorResponse("Too Many Requests", 429, "RATE_LIMIT_EXCEEDED");
    res.headers.set("Retry-After", "60");
    res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT));
    res.headers.set("X-RateLimit-Remaining", "0");
    return res;
  }

  // ── 3. Input validation ──────────────────────────────────────────────────
  const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = searchParamsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return errorResponse(
      "Invalid query parameters",
      400,
      "VALIDATION_ERROR"
    );
  }

  const { search, status, priority, cursor, limit } = parsed.data;

  // ── 4. Build Prisma where clause (IDOR: always scope to userId) ──────────
  const where: Prisma.TaskWhereInput = {
    // IDOR prevention: only return tasks belonging to the authenticated user
    userId,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  // ── 5. Cursor-based pagination ───────────────────────────────────────────
  const paginationArgs: Prisma.TaskFindManyArgs = {
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1, // fetch one extra to determine if there's a next page
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      // userId intentionally omitted — no need to expose it in the response
    },
  };

  if (cursor) {
    paginationArgs.cursor = { id: cursor };
    paginationArgs.skip = 1; // skip the cursor item itself
  }

  // ── 6. Query ─────────────────────────────────────────────────────────────
  let tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    createdAt: Date;
    updatedAt: Date;
  }>;

  try {
    tasks = await prisma.task.findMany(paginationArgs) as typeof tasks;
  } catch {
    // Do not expose internal error details (Section 3.7)
    return errorResponse("Internal Server Error", 500, "INTERNAL_ERROR");
  }

  // ── 7. Determine next cursor ─────────────────────────────────────────────
  const hasNextPage = tasks.length > limit;
  if (hasNextPage) tasks.pop(); // remove the extra item

  const nextCursor = hasNextPage ? tasks[tasks.length - 1]?.id ?? null : null;

  // ── 8. Build response ────────────────────────────────────────────────────
  const res = successResponse(tasks, {
    nextCursor,
    hasNextPage,
    limit,
  });

  res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT));
  res.headers.set("X-RateLimit-Remaining", String(remaining));

  return res;
}
