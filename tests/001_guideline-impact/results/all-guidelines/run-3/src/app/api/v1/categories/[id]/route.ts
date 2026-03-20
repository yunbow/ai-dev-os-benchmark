import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiRateLimited,
  apiInternalError,
  withRateLimitHeaders,
} from "@/lib/api-response";
import { CategoryUpdateSchema } from "@/features/categories/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.read);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return apiNotFound("Category");

    if (category.userId !== session.user.id) return apiForbidden();

    return withRateLimitHeaders(
      apiSuccess(category),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[GET /api/v1/categories/:id]", error);
    return apiInternalError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.write);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const body = await request.json().catch(() => null);
    if (!body) return apiError("INVALID_JSON", "Request body must be valid JSON", 400);

    const parsed = CategoryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return apiValidationError(fieldErrors);
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return apiNotFound("Category");

    // IDOR prevention
    if (category.userId !== session.user.id) return apiForbidden();

    const data = parsed.data;
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.color ? { color: data.color } : {}),
      },
    });

    return withRateLimitHeaders(
      apiSuccess(updated),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[PATCH /api/v1/categories/:id]", error);
    return apiInternalError();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rateLimitResult = checkRateLimit(`user:${session.user.id}`, RateLimitPresets.write);
    if (!rateLimitResult.allowed) return apiRateLimited(rateLimitResult.retryAfter);

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return apiNotFound("Category");

    // IDOR prevention
    if (category.userId !== session.user.id) return apiForbidden();

    await prisma.category.delete({ where: { id } });

    return withRateLimitHeaders(
      apiSuccess({ message: "Category deleted successfully" }),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    console.error("[DELETE /api/v1/categories/:id]", error);
    return apiInternalError();
  }
}
