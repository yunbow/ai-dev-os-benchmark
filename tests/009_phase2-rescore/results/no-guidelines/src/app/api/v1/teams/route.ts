import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTeamSchema } from "@/lib/validations/team";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiInternalError,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";
import { TeamRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const limited = readRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  try {
    const teams = await db.team.findMany({
      where: { members: { some: { userId: session.user.id } } },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(teams);
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

  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error.errors);

  try {
    const team = await db.team.create({
      data: {
        ...parsed.data,
        members: { create: { userId: session.user.id, role: TeamRole.OWNER } },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return apiSuccess(team, 201);
  } catch {
    return apiInternalError();
  }
}
