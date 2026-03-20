import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RateLimits } from "@/lib/api/rate-limit";
import { categorySchema } from "@/features/categories/schema";
import { prisma } from "@/lib/prisma/client";

function getIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for") ?? "unknown";
}

export async function GET(req: NextRequest) {
  const ip = getIp(req);
  const { success: ok } = checkRateLimit(`api:read:${ip}`, RateLimits.read);
  if (!ok) return apiError("RATE_LIMITED", "Too many requests", [], 429);

  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "Unauthorized", [], 401);

  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { team: { members: { some: { userId: session.user.id } } } },
      ],
    },
  });

  return apiSuccess(categories);
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const { success: ok } = checkRateLimit(`api:write:${ip}`, RateLimits.write);
  if (!ok) return apiError("RATE_LIMITED", "Too many requests", [], 429);

  const session = await auth();
  if (!session?.user?.id) return apiError("UNAUTHORIZED", "Unauthorized", [], 401);

  const body = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, parsed.error.issues);
  }

  const { name, color, teamId } = parsed.data;
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#000000";

  const category = await prisma.category.create({
    data: {
      name,
      color: safeColor,
      ...(teamId ? { teamId } : { userId: session.user.id }),
    },
  });

  return apiSuccess(category, 201);
}
