import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateCategorySchema } from "@/lib/validations/category";
import {
  apiSuccess,
  apiBadRequest,
  apiUnauthorized,
  apiNotFound,
  apiInternalError,
} from "@/lib/api-response";
import {
  writeRateLimiter,
  readRateLimiter,
  getIdentifier,
  rateLimitResponse,
} from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "categories:read");
  const rateLimitResult = readRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  try {
    const category = await db.category.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { team: { members: { some: { userId: session.user.id } } } },
        ],
      },
    });

    if (!category) return apiNotFound("Category");

    return apiSuccess(category);
  } catch (error) {
    console.error("GET /api/v1/categories/[id] error:", error);
    return apiInternalError();
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "categories:write");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return apiBadRequest("Validation failed", details);
    }

    // IDOR protection
    const existing = await db.category.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ["OWNER", "MEMBER"] },
                },
              },
            },
          },
        ],
      },
    });

    if (!existing) return apiNotFound("Category");

    const { color, ...rest } = parsed.data;
    const safeColor =
      color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : undefined;

    const category = await db.category.update({
      where: { id },
      data: {
        ...rest,
        ...(safeColor && { color: safeColor }),
      },
    });

    return apiSuccess(category);
  } catch (error) {
    console.error("PATCH /api/v1/categories/[id] error:", error);
    return apiInternalError();
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const identifier = getIdentifier(request, "categories:write");
  const rateLimitResult = writeRateLimiter.check(identifier);
  if (!rateLimitResult.success) return rateLimitResponse(rateLimitResult.resetTime);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  try {
    // IDOR protection
    const category = await db.category.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ["OWNER"] },
                },
              },
            },
          },
        ],
      },
    });

    if (!category) return apiNotFound("Category");

    await db.category.delete({ where: { id } });

    return apiSuccess({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/v1/categories/[id] error:", error);
    return apiInternalError();
  }
}
