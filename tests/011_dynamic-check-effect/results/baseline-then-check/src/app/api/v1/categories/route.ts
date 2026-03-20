import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { categorySchema } from "@/lib/validations/category";
import {
  apiSuccess,
  zodErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  rateLimitResponse,
  invalidBodyResponse,
} from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`read:${ip}`, RATE_LIMITS.read.limit, RATE_LIMITS.read.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const teamId = req.nextUrl.searchParams.get("teamId");
  const userId = session.user.id;

  const categories = await db.category.findMany({
    where: teamId
      ? {
          teamId,
          team: { members: { some: { userId } } },
        }
      : { userId },
    orderBy: { name: "asc" },
  });

  return apiSuccess(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`write:${ip}`, RATE_LIMITS.write.limit, RATE_LIMITS.write.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const body = await req.json().catch(() => null);
  if (!body) return invalidBodyResponse();

  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const userId = session.user.id;

  if (parsed.data.teamId) {
    const member = await db.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: parsed.data.teamId } },
    });
    if (!member || member.role === "VIEWER") return forbiddenResponse();
  }

  const category = await db.category.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      userId: parsed.data.teamId ? null : userId,
      teamId: parsed.data.teamId ?? null,
    },
  });

  return apiSuccess(category, 201);
}
