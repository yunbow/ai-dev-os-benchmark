import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inviteMemberSchema } from "@/features/teams/schema/team-schema";
import crypto from "crypto";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: id, userId: session.user.id } },
  });

  if (!membership) return errorResponse("FORBIDDEN", "Not a team member", 403);

  const members = await prisma.teamMember.findMany({
    where: { teamId: id },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ data: members });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: id, userId: session.user.id } },
  });

  if (!membership || membership.role !== "OWNER") {
    return errorResponse("FORBIDDEN", "Only team owners can invite members", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.teamInvitation.create({
    data: {
      email: parsed.data.email,
      token,
      role: parsed.data.role,
      teamId: id,
      expiresAt,
    },
  });

  return NextResponse.json({ data: { id: invitation.id, email: invitation.email } }, { status: 201 });
}
