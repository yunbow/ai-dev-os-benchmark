import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { CreateTaskSchema, TaskFiltersSchema } from "@/features/task/schema/task-schema";
import { fetchTasks, taskInclude } from "@/features/task/services/task-service";

function errorResponse(
  code: string,
  message: string,
  details: unknown[] = [],
  status = 400,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status, headers: extraHeaders }
  );
}

export async function GET(req: NextRequest) {
  const rl = applyRateLimit(req, "read");
  if (!rl.allowed) return rl.response!;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401, rl.headers);
  }

  const url = new URL(req.url);
  const rawFilters = Object.fromEntries(url.searchParams.entries());

  const parsed = TaskFiltersSchema.safeParse(rawFilters);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid query parameters",
      parsed.error.errors,
      400,
      rl.headers
    );
  }

  try {
    const result = await fetchTasks(session.user.id, parsed.data);
    const res = NextResponse.json(
      {
        data: result.tasks,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
      { headers: rl.headers }
    );
    return res;
  } catch {
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", [], 500, rl.headers);
  }
}

export async function POST(req: NextRequest) {
  const rl = applyRateLimit(req, "write");
  if (!rl.allowed) return rl.response!;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401, rl.headers);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_JSON", "Request body must be valid JSON", [], 400, rl.headers);
  }

  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid input",
      parsed.error.errors,
      400,
      rl.headers
    );
  }

  const { title, description, status, priority, dueDate, categoryId, assigneeId, teamId } =
    parsed.data;

  try {
    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: session.user.id } },
      });
      if (!membership) {
        return errorResponse("FORBIDDEN", "You are not a member of this team", [], 403, rl.headers);
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        status,
        priority,
        dueDate: dueDate ?? null,
        creatorId: session.user.id,
        categoryId: categoryId ?? null,
        assigneeId: assigneeId ?? null,
        teamId: teamId ?? null,
      },
      include: taskInclude,
    });

    return NextResponse.json({ data: task }, { status: 201, headers: rl.headers });
  } catch {
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", [], 500, rl.headers);
  }
}
