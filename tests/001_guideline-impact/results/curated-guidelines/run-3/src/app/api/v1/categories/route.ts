import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiTooManyRequests,
  apiValidationError,
  apiInternalError,
} from "@/lib/api/response";
import { CategorySchema } from "@/features/categories/schema/category-schema";
import {
  createCategory,
  getCategories,
} from "@/features/categories/server/category-actions";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rl = checkRateLimit(session.user.id, "read");
    if (!rl.allowed) return apiTooManyRequests(rl.resetAt);

    const teamId = new URL(request.url).searchParams.get("teamId") ?? undefined;
    const result = await getCategories(teamId);

    if (!result.success) {
      if (result.error.code === "FORBIDDEN") return apiForbidden();
      return apiInternalError();
    }

    return apiSuccess(result.data, { headers: getRateLimitHeaders(rl) });
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

    const parsed = CategorySchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const result = await createCategory(parsed.data);

    if (!result.success) {
      if (result.error.code === "FORBIDDEN") return apiForbidden();
      return apiInternalError();
    }

    return apiSuccess(result.data, { status: 201, headers: getRateLimitHeaders(rl) });
  } catch {
    return apiInternalError();
  }
}
