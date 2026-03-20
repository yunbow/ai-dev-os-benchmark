import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiError, apiPaginated, apiSuccess, handleZodError } from "@/lib/api-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { CreateTaskSchema, TaskFilterSchema } from "@/lib/validations/task";
import * as taskService from "@/lib/services/task.service";
import type { AuthenticatedSession } from "@/lib/api-helpers";

export const GET = withAuth(async (req: NextRequest, session: AuthenticatedSession) => {
  const { searchParams } = new URL(req.url);
  const rawFilters = Object.fromEntries(searchParams.entries());

  const rl = checkRateLimit(session.user.id, "read");
  if (!rl.allowed) {
    return apiError(429, "RATE_LIMITED", "Too many requests. Please try again later.");
  }

  const parsed = TaskFilterSchema.safeParse(rawFilters);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const result = await taskService.getTasks(session.user.id, parsed.data);
    return apiPaginated(result.data, result.nextCursor, result.hasMore);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "FORBIDDEN") return apiError(403, "FORBIDDEN", "Access denied");
    return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
  }
});

export const POST = withAuth(async (req: NextRequest, session: AuthenticatedSession) => {
  const rl = checkRateLimit(session.user.id, "write");
  if (!rl.allowed) {
    return apiError(429, "RATE_LIMITED", "Too many requests. Please try again later.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const task = await taskService.createTask(parsed.data, session.user.id);
    return apiSuccess(task, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "FORBIDDEN") return apiError(403, "FORBIDDEN", "Access denied");
    return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
  }
});
