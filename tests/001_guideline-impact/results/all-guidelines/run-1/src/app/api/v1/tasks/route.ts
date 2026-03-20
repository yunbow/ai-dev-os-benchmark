import { auth } from "@/lib/auth";
import {
  checkRateLimit,
  getClientIp,
  setRateLimitHeaders,
} from "@/lib/api/rate-limit";
import {
  apiUnauthorized,
  apiRateLimited,
  actionResultToResponse,
  apiValidationError,
} from "@/lib/api/response";
import { createTask, listTasks } from "@/features/tasks/server/task-actions";
import { createTaskSchema, taskFilterSchema } from "@/features/tasks/schema/task-schema";

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const ip = getClientIp(request);
  const rateLimitResult = checkRateLimit(`${ip}:tasks:read`, "read");

  const responseHeaders = new Headers();
  setRateLimitHeaders(responseHeaders, rateLimitResult);

  if (!rateLimitResult.allowed) {
    return apiRateLimited(rateLimitResult.retryAfter ?? 60);
  }

  const { searchParams } = new URL(request.url);

  const filterInput = {
    status: searchParams.get("status") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    assigneeId: searchParams.get("assigneeId") ?? undefined,
    teamId: searchParams.get("teamId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    sortBy: (searchParams.get("sortBy") ?? "createdAt") as "createdAt" | "dueDate" | "priority",
    sortOrder: (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc",
    cursor: searchParams.get("cursor") ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "20"),
  };

  const parsed = taskFilterSchema.safeParse(filterInput);
  if (!parsed.success) {
    return apiValidationError("Invalid query parameters");
  }

  const result = await listTasks(parsed.data);
  const response = actionResultToResponse(result);

  setRateLimitHeaders(response.headers, rateLimitResult);
  return response;
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const ip = getClientIp(request);
  const rateLimitResult = checkRateLimit(`${ip}:tasks:write`, "write");

  if (!rateLimitResult.allowed) {
    return apiRateLimited(rateLimitResult.retryAfter ?? 60);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiValidationError("Invalid JSON body");
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError("Validation failed", parsed.error.issues);
  }

  const result = await createTask(parsed.data);
  const response = actionResultToResponse(result, 201);
  setRateLimitHeaders(response.headers, rateLimitResult);
  return response;
}
