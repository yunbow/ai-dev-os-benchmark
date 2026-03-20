import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { CreateTeamSchema } from "@/features/team/schema/team-schema";
import { getUserTeams } from "@/features/team/services/team-service";
import { TeamRole } from "@prisma/client";

function errorResponse(
  code: string,
  message: string,
  details: unknown[] = [],
  status = 400,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status, headers: extraHeaders }
  );
}

export async function GET(req: NextRequest) {
  const rl = applyRateLimit(req, "read");
  if (!rl.allowed) return rl.response!;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401, rl.headers);
  }

  try {
    const teams = await getUserTeams(session.user.id);
    return NextResponse.json({ data: teams }, { headers: rl.headers });
  } catch {
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", [], 500, rl.headers);
  }
}

export async function POST(req: NextRequest) {
  const rl = applyRateLimit(req, "write");
  if (!rl.allowed) return rl.response!;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401, rl.headers);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_JSON", "Request body must be valid JSON", [], 400, rl.headers);
  }

  const parsed = CreateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid input",
      parsed.error.errors,
      400,
      rl.headers
    );
  }

  try {
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: { name: parsed.data.name, ownerId: session.user!.id! },
        select: { id: true, name: true, ownerId: true, createdAt: true },
      });

      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId: session.user!.id!,
          role: TeamRole.OWNER,
        },
      });

      return newTeam;
    });

    return NextResponse.json({ data: team }, { status: 201, headers: rl.headers });
  } catch {
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", [], 500, rl.headers);
  }
}
