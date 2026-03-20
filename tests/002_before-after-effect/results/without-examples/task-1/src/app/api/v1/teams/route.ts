import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTeamSchema } from "@/lib/validations/team";
import { checkRateLimit, getRateLimitHeaders, getClientIp } from "@/lib/security/rate-limiter";
import type { ApiError } from "@/lib/types";
import { TeamRole } from "@prisma/client";

function errorResponse(code: string, message: string, status: number, details?: unknown[]): NextResponse<ApiError> {
  return NextResponse.json({ error: { code, message, details: details ?? [] } }, { status });
}

function checkCsrfOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!origin) return true;
  return origin === appUrl;
}

const TEAM_INCLUDE = {
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
} as const;

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`read:${clientIp}`, "read");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const userId = session.user.id;

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId } } },
    include: TEAM_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json({ data: teams, nextCursor: null, hasMore: false }, { headers });
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  if (!checkCsrfOrigin(req)) return errorResponse("FORBIDDEN", "Invalid origin", 403);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const userId = session.user.id;

  let body: unknown;
  try { body = await req.json(); } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) return errorResponse("VALIDATION_ERROR", "Invalid input", 400, parsed.error.issues);

  const team = await prisma.$transaction(async (tx) => {
    const newTeam = await tx.team.create({ data: { name: parsed.data.name } });
    await tx.teamMember.create({
      data: { userId, teamId: newTeam.id, role: TeamRole.OWNER },
    });
    return tx.team.findUnique({ where: { id: newTeam.id }, include: TEAM_INCLUDE });
  });

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json(team, { status: 201, headers });
}
