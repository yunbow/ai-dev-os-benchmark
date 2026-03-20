import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import {
  apiSuccess,
  apiUnauthorized,
  apiTooManyRequests,
  apiValidationError,
  apiInternalError,
} from "@/lib/api/response";
import { TaskSchema, TaskFiltersSchema } from "@/features/tasks/schema/task-schema";
import { createTask, getTasks } from "@/features/tasks/server/task-actions";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rl = checkRateLimit(session.user.id, "read");
    if (!rl.allowed) return apiTooManyRequests(rl.resetAt);

    const { searchParams } = new URL(request.url);
    const rawFilters = Object.fromEntries(searchParams.entries());

    const parsed = TaskFiltersSchema.safeParse(rawFilters);
    if (!parsed.success) {
      return apiValidationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const result = await getTasks(parsed.data);

    if (!result.success) {
      return apiInternalError();
    }

    return apiSuccess(result.data.tasks, {
      pagination: {
        hasNextPage: result.data.hasNextPage,
        nextCursor: result.data.nextCursor,
        total: result.data.total,
      },
      headers: getRateLimitHeaders(rl),
    });
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rl = checkRateLimit(session.user.id, "write");
    if (!rl.allowed) return apiTooManyRequests(rl.resetAt);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiValidationError({ body: ["Invalid JSON"] });
    }

    const parsed = TaskSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const result = await createTask(parsed.data);

    if (!result.success) {
      if (result.error.code === "FORBIDDEN") {
        return apiUnauthorized(result.error.message);
      }
      return apiInternalError();
    }

    return apiSuccess(result.data, { status: 201, headers: getRateLimitHeaders(rl) });
  } catch {
    return apiInternalError();
  }
}
