import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { ZodError } from "zod";
import { CreateTeamSchema } from "@/features/teams/schema/team-schema";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message, details: [] } }, { status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.user.id, teamId: id } },
  });
  if (!member) return errorResponse("FORBIDDEN", "Access denied", 403);

  const team = await prisma.team.findUnique({
    where: { id },
    include: { members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } } },
  });
  if (!team) return errorResponse("NOT_FOUND", "Team not found", 404);

  return NextResponse.json(team);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.user.id, teamId: id } },
  });
  if (!member || member.role !== "OWNER") return errorResponse("FORBIDDEN", "Only the team owner can delete the team", 403);

  await prisma.team.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
