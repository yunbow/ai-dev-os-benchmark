import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { UpdateTeamSchema } from "@/features/teams/schema/team-schema";
import { ActionErrors } from "@/lib/actions/errors";

function errorResponse(error: { code: string; message: string }, status: number) {
  return NextResponse.json({ error }, { status });
}

const teamInclude = {
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse(ActionErrors.unauthorized(), 401);

  const rl = rateLimit(`api:read:${session.user.id}`, 100, 60000);
  if (!rl.success) return errorResponse(ActionErrors.rateLimited(), 429);

  const { id } = await params;

  const team = await prisma.team.findUnique({ where: { id }, include: teamInclude });
  if (!team) return errorResponse({ code: "NOT_FOUND", message: "Team not found" }, 404);

  const isMember = team.members.some((m) => m.userId === session.user.id);
  if (!isMember) return errorResponse(ActionErrors.forbidden(), 403);

  return NextResponse.json({ data: team }, { headers: rateLimitHeaders(rl) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse(ActionErrors.unauthorized(), 401);

  const rl = rateLimit(`api:write:${session.user.id}`, 30, 60000);
  if (!rl.success) return errorResponse(ActionErrors.rateLimited(), 429);

  const { id } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: id, userId: session.user.id } },
  });

  if (!membership) return errorResponse({ code: "NOT_FOUND", message: "Team not found" }, 404);
  if (membership.role !== "OWNER") return errorResponse(ActionErrors.forbidden(), 403);

  const body = await req.json().catch(() => null);
  if (!body) return errorResponse(ActionErrors.badRequest("Invalid JSON"), 400);

  const parsed = UpdateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  const team = await prisma.team.update({ where: { id }, data: parsed.data, include: teamInclude });
  return NextResponse.json({ data: team }, { headers: rateLimitHeaders(rl) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse(ActionErrors.unauthorized(), 401);

  const rl = rateLimit(`api:write:${session.user.id}`, 30, 60000);
  if (!rl.success) return errorResponse(ActionErrors.rateLimited(), 429);

  const { id } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: id, userId: session.user.id } },
  });

  if (!membership || membership.role !== "OWNER") return errorResponse(ActionErrors.forbidden(), 403);

  await prisma.team.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
