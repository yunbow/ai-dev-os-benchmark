import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError, apiPaginated } from "@/lib/api/response";
import { checkRateLimit, RateLimits } from "@/lib/api/rate-limit";
import { listTasksSchema, createTaskSchema } from "@/features/tasks/schema";
import { listTasks, createTask } from "@/features/tasks/services/task-service";

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for") ?? "unknown";
}

export async function GET(req: NextRequest) {
  const ip = getIp(req);
  const { success: ok } = checkRateLimit(`api:read:${ip}`, RateLimits.read);
  if (!ok) return apiError("RATE_LIMITED", "Too many requests", [], 429);

  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "Unauthorized", [], 401);

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = listTasksSchema.safeParse(params);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  const { items, nextCursor, hasMore } = await listTasks(session.user.id, parsed.data);
  return apiPaginated(items, nextCursor, hasMore);
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const { success: ok } = checkRateLimit(`api:write:${ip}`, RateLimits.write);
  if (!ok) return apiError("RATE_LIMITED", "Too many requests", [], 429);

  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "Unauthorized", [], 401);

  const body = await req.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  const task = await createTask(session.user.id, parsed.data);
  return apiSuccess(task, 201);
}
