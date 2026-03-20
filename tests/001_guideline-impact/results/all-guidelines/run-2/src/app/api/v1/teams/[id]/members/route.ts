import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { InviteMemberSchema } from "@/features/teams/schema/team-schema";
import { ZodError } from "zod";
import { nanoid } from "nanoid";
import { sendTeamInvitationEmail } from "@/lib/email";

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

  const members = await prisma.teamMember.findMany({
    where: { teamId: id },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ data: members, nextCursor: null, hasMore: false });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.user.id, teamId: id } },
  });
  if (!member || member.role !== "OWNER") return errorResponse("FORBIDDEN", "Only the team owner can invite members", 403);

  try {
    const body = await req.json();
    const validated = InviteMemberSchema.parse({ ...body, teamId: id });

    const team = await prisma.team.findUnique({
      where: { id },
      include: { owner: { select: { name: true } } },
    });
    if (!team) return errorResponse("NOT_FOUND", "Team not found", 404);

    await prisma.teamInvitation.updateMany({
      where: { email: validated.email, teamId: id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = nanoid(32);
    await prisma.teamInvitation.create({
      data: {
        email: validated.email,
        token,
        role: validated.role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        teamId: id,
        inviterId: session.user.id,
      },
    });

    await sendTeamInvitationEmail(validated.email, team.name, team.owner.name || "A team member", token);
    return NextResponse.json({ message: "Invitation sent" }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return errorResponse("VALIDATION_ERROR", "userId query parameter required", 400);

  if (userId !== session.user.id) {
    const ownerMember = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: session.user.id, teamId: id } },
    });
    if (!ownerMember || ownerMember.role !== "OWNER") return errorResponse("FORBIDDEN", "Only the team owner can remove members", 403);
  }

  const targetMember = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: id } },
  });
  if (!targetMember) return errorResponse("NOT_FOUND", "Member not found", 404);
  if (targetMember.role === "OWNER") return errorResponse("CONFLICT", "Cannot remove the team owner", 409);

  await prisma.teamMember.delete({ where: { userId_teamId: { userId, teamId: id } } });
  return new NextResponse(null, { status: 204 });
}
