import { NextRequest } from "next/server";
import { withAuth, apiError, apiSuccess, handleZodError } from "@/lib/api-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { UpdateTaskSchema } from "@/lib/validations/task";
import * as taskService from "@/lib/services/task.service";
import type { AuthenticatedSession } from "@/lib/api-helpers";

export const GET = withAuth(
  async (req: NextRequest, session: AuthenticatedSession, params) => {
    const rl = checkRateLimit(session.user.id, "read");
    if (!rl.allowed) return apiError(429, "RATE_LIMITED", "Too many requests");

    try {
      const task = await taskService.getTaskById(params!.id, session.user.id);
      return apiSuccess(task);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "NOT_FOUND") return apiError(404, "NOT_FOUND", "Task not found");
      if (message === "FORBIDDEN") return apiError(403, "FORBIDDEN", "Access denied");
      return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
    }
  }
);

export const PATCH = withAuth(
  async (req: NextRequest, session: AuthenticatedSession, params) => {
    const rl = checkRateLimit(session.user.id, "write");
    if (!rl.allowed) return apiError(429, "RATE_LIMITED", "Too many requests");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
    }

    const parsed = UpdateTaskSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    try {
      const task = await taskService.updateTask(params!.id, parsed.data, session.user.id);
      return apiSuccess(task);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "NOT_FOUND") return apiError(404, "NOT_FOUND", "Task not found");
      if (message === "FORBIDDEN") return apiError(403, "FORBIDDEN", "Access denied");
      return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
    }
  }
);

export const DELETE = withAuth(
  async (req: NextRequest, session: AuthenticatedSession, params) => {
    const rl = checkRateLimit(session.user.id, "write");
    if (!rl.allowed) return apiError(429, "RATE_LIMITED", "Too many requests");

    try {
      await taskService.deleteTask(params!.id, session.user.id);
      return new Response(null, { status: 204 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "NOT_FOUND") return apiError(404, "NOT_FOUND", "Task not found");
      if (message === "FORBIDDEN") return apiError(403, "FORBIDDEN", "Access denied");
      return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
    }
  }
);
