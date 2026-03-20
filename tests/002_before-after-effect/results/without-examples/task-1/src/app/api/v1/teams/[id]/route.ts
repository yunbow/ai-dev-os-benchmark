import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateTeamSchema } from "@/lib/validations/team";
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

async function checkTeamAccess(teamId: string, userId: string, minRole: TeamRole = TeamRole.VIEWER) {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!membership) return { membership: null, hasAccess: false };

  const roleOrder: Record<TeamRole, number> = {
    [TeamRole.OWNER]: 3,
    [TeamRole.MEMBER]: 2,
    [TeamRole.VIEWER]: 1,
  };

  const hasAccess = roleOrder[membership.role] >= roleOrder[minRole];
  return { membership, hasAccess };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`read:${clientIp}`, "read");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { hasAccess } = await checkTeamAccess(id, session.user.id);
  if (!hasAccess) return errorResponse("FORBIDDEN", "Access denied", 403);

  const team = await prisma.team.findUnique({ where: { id }, include: TEAM_INCLUDE });
  if (!team) return errorResponse("NOT_FOUND", "Team not found", 404);

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json(team, { headers });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  if (!checkCsrfOrigin(req)) return errorResponse("FORBIDDEN", "Invalid origin", 403);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { hasAccess } = await checkTeamAccess(id, session.user.id, TeamRole.OWNER);
  if (!hasAccess) return errorResponse("FORBIDDEN", "Only team owners can update team details", 403);

  let body: unknown;
  try { body = await req.json(); } catch {
    return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) return errorResponse("VALIDATION_ERROR", "Invalid input", 400, parsed.error.issues);

  const team = await prisma.team.update({
    where: { id },
    data: parsed.data,
    include: TEAM_INCLUDE,
  });

  const headers = getRateLimitHeaders(rateLimitResult);
  return NextResponse.json(team, { headers });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(`write:${clientIp}`, "write");
  if (!rateLimitResult.success) return errorResponse("RATE_LIMITED", "Too many requests", 429);

  if (!checkCsrfOrigin(req)) return errorResponse("FORBIDDEN", "Invalid origin", 403);

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { hasAccess } = await checkTeamAccess(id, session.user.id, TeamRole.OWNER);
  if (!hasAccess) return errorResponse("FORBIDDEN", "Only team owners can delete the team", 403);

  await prisma.team.delete({ where: { id } });

  const headers = getRateLimitHeaders(rateLimitResult);
  return new NextResponse(null, { status: 204, headers });
}
