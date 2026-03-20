import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { TeamRole } from "@prisma/client";
import type { NextRequest } from "next/server";

function errorResponse(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

const TEAM_INCLUDE = {
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  _count: { select: { members: true } },
};

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id: teamId } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });
  if (!membership) return errorResponse("FORBIDDEN", "You are not a member of this team", 403);

  const team = await prisma.team.findUnique({ where: { id: teamId }, include: TEAM_INCLUDE });
  if (!team) return errorResponse("NOT_FOUND", "Team not found", 404);

  return Response.json(team);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { success: rateLimitOk } = await checkRateLimit(`write:${session.user.id}`, RATE_LIMITS.write);
  if (!rateLimitOk) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests", 429);

  const { id: teamId } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });
  if (!membership || membership.role !== TeamRole.OWNER) {
    return errorResponse("FORBIDDEN", "Only team owners can delete the team", 403);
  }

  await prisma.team.delete({ where: { id: teamId } });
  return new Response(null, { status: 204 });
}
