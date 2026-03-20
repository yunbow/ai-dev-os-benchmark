import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCategorySchema } from "@/lib/validations/category";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiInternalError,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";
import { TeamRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const limited = readRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const teamId = req.nextUrl.searchParams.get("teamId") ?? undefined;

  try {
    const categories = await db.category.findMany({
      where: teamId
        ? { teamId }
        : { userId: session.user.id },
      orderBy: { name: "asc" },
    });

    return apiSuccess(categories);
  } catch {
    return apiInternalError();
  }
}

export async function POST(req: NextRequest) {
  const limited = writeRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError({ code: "INVALID_JSON", message: "Invalid JSON body", details: [] }, 400);
  }

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error.errors);

  const { teamId, ...rest } = parsed.data;

  if (teamId) {
    const member = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!member || member.role === TeamRole.VIEWER) return apiForbidden();
  }

  try {
    const category = await db.category.create({
      data: {
        ...rest,
        userId: teamId ? null : session.user.id,
        teamId: teamId ?? null,
      },
    });

    return apiSuccess(category, 201);
  } catch {
    return apiInternalError();
  }
}
