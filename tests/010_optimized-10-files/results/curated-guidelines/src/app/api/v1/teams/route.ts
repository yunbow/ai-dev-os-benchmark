import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { CreateTeamSchema } from "@/features/teams/schema/team-schema";
import { TeamRole } from "@prisma/client";
import type { NextRequest } from "next/server";

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return Response.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

const TEAM_INCLUDE = {
  members: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  _count: { select: { members: true } },
};

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { success: rateLimitOk } = await checkRateLimit(`read:${session.user.id}`, RATE_LIMITS.read);
  if (!rateLimitOk) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests", 429);

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: TEAM_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: teams });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { success: rateLimitOk } = await checkRateLimit(`write:${session.user.id}`, RATE_LIMITS.write);
  if (!rateLimitOk) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);
  }

  const parsed = CreateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  try {
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: { name: parsed.data.name, ownerId: session.user!.id! },
      });
      await tx.teamMember.create({
        data: { teamId: newTeam.id, userId: session.user!.id!, role: TeamRole.OWNER },
      });
      return tx.team.findUniqueOrThrow({ where: { id: newTeam.id }, include: TEAM_INCLUDE });
    });

    return Response.json(team, { status: 201 });
  } catch (err) {
    console.error("Create team error:", err);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
