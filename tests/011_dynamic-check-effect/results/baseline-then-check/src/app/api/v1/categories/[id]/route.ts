import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { updateCategorySchema } from "@/lib/validations/category";
import {
  apiSuccess,
  zodErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  rateLimitResponse,
  invalidBodyResponse,
} from "@/lib/api-response";

async function getCategoryWithPermission(
  categoryId: string,
  userId: string,
  write = false
) {
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) return { category: null, allowed: false };

  if (category.userId) {
    return { category, allowed: category.userId === userId };
  }

  if (category.teamId) {
    const member = await db.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: category.teamId } },
    });
    if (!member) return { category, allowed: false };
    if (write && member.role === "VIEWER") return { category, allowed: false };
    return { category, allowed: true };
  }

  return { category, allowed: false };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`read:${ip}`, RATE_LIMITS.read.limit, RATE_LIMITS.read.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const { category, allowed } = await getCategoryWithPermission(id, session.user.id);
  if (!category) return notFoundResponse("Category");
  if (!allowed) return forbiddenResponse();

  return apiSuccess(category);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`write:${ip}`, RATE_LIMITS.write.limit, RATE_LIMITS.write.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const { category, allowed } = await getCategoryWithPermission(id, session.user.id, true);
  if (!category) return notFoundResponse("Category");
  if (!allowed) return forbiddenResponse();

  const body = await req.json().catch(() => null);
  if (!body) return invalidBodyResponse();

  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const updated = await db.category.update({ where: { id }, data: parsed.data });
  return apiSuccess(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`write:${ip}`, RATE_LIMITS.write.limit, RATE_LIMITS.write.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const { category, allowed } = await getCategoryWithPermission(id, session.user.id, true);
  if (!category) return notFoundResponse("Category");
  if (!allowed) return forbiddenResponse();

  await db.category.delete({ where: { id } });
  return apiSuccess({ message: "Category deleted" });
}
