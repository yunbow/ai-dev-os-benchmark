import { NextRequest } from "next/server";
import { withAuth, apiError, apiSuccess, handleZodError } from "@/lib/api-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { CreateCategorySchema } from "@/lib/validations/category";
import * as categoryService from "@/lib/services/category.service";
import type { AuthenticatedSession } from "@/lib/api-helpers";

export const GET = withAuth(async (req: NextRequest, session: AuthenticatedSession) => {
  const rl = checkRateLimit(session.user.id, "read");
  if (!rl.allowed) return apiError(429, "RATE_LIMITED", "Too many requests");

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");

  try {
    const categories = await categoryService.getCategories(session.user.id, teamId);
    return apiSuccess(categories);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "FORBIDDEN") return apiError(403, "FORBIDDEN", "Access denied");
    return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
  }
});

export const POST = withAuth(async (req: NextRequest, session: AuthenticatedSession) => {
  const rl = checkRateLimit(session.user.id, "write");
  if (!rl.allowed) return apiError(429, "RATE_LIMITED", "Too many requests");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const parsed = CreateCategorySchema.safeParse(body);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const category = await categoryService.createCategory(parsed.data, session.user.id);
    return apiSuccess(category, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "FORBIDDEN") return apiError(403, "FORBIDDEN", "Access denied");
    return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
  }
});
