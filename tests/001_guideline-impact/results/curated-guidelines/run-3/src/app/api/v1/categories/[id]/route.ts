import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiTooManyRequests,
  apiValidationError,
  apiInternalError,
} from "@/lib/api/response";
import { UpdateCategorySchema } from "@/features/categories/schema/category-schema";
import {
  updateCategory,
  deleteCategory,
} from "@/features/categories/server/category-actions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const parsed = UpdateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { id } = await params;
    const result = await updateCategory(id, parsed.data);

    if (!result.success) {
      if (result.error.code === "NOT_FOUND") return apiNotFound();
      if (result.error.code === "FORBIDDEN") return apiForbidden();
      return apiInternalError();
    }

    return apiSuccess(result.data, { headers: getRateLimitHeaders(rl) });
  } catch {
    return apiInternalError();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rl = checkRateLimit(session.user.id, "write");
    if (!rl.allowed) return apiTooManyRequests(rl.resetAt);

    const { id } = await params;
    const result = await deleteCategory(id);

    if (!result.success) {
      if (result.error.code === "NOT_FOUND") return apiNotFound();
      if (result.error.code === "FORBIDDEN") return apiForbidden();
      return apiInternalError();
    }

    return apiSuccess(result.data, { headers: getRateLimitHeaders(rl) });
  } catch {
    return apiInternalError();
  }
}
