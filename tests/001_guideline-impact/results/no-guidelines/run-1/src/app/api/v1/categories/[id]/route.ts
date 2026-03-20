import { NextRequest } from "next/server";
import { withAuth, apiError, apiSuccess, handleZodError } from "@/lib/api-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { UpdateCategorySchema } from "@/lib/validations/category";
import * as categoryService from "@/lib/services/category.service";
import type { AuthenticatedSession } from "@/lib/api-helpers";

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

    const parsed = UpdateCategorySchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    try {
      const category = await categoryService.updateCategory(params!.id, parsed.data, session.user.id);
      return apiSuccess(category);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "NOT_FOUND") return apiError(404, "NOT_FOUND", "Category not found");
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
      await categoryService.deleteCategory(params!.id, session.user.id);
      return new Response(null, { status: 204 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "NOT_FOUND") return apiError(404, "NOT_FOUND", "Category not found");
      if (message === "FORBIDDEN") return apiError(403, "FORBIDDEN", "Access denied");
      return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
    }
  }
);
