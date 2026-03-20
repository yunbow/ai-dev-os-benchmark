import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inviteMemberSchema } from "@/lib/validations";
import { sendTeamInvitationEmail } from "@/lib/email";
import crypto from "crypto";

function errorResponse(
  code: string,
  message: string,
  status: number,
  details: unknown[] = []
) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  const { id: teamId } = await params;
  const userId = session.user.id;

  // Verify user is a member
  const member = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!member) {
    return errorResponse("NOT_FOUND", "Team not found.", 404);
  }

  const members = await db.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ data: members });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  const { id: teamId } = await params;
  const userId = session.user.id;

  // Verify user is OWNER or MEMBER (not VIEWER)
  const member = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!member || member.role === "VIEWER") {
    return errorResponse(
      "FORBIDDEN",
      "You do not have permission to invite members.",
      403
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON in request body.", 400);
  }

  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid invitation data.",
      400,
      parsed.error.issues
    );
  }

  const { email } = parsed.data;

  // Check if already a member
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const existingMember = await db.teamMember.findUnique({
      where: { userId_teamId: { userId: existingUser.id, teamId } },
    });
    if (existingMember) {
      return errorResponse(
        "ALREADY_MEMBER",
        "This user is already a member of the team.",
        409
      );
    }
  }

  // Check for existing pending invitation
  const existingInvite = await db.teamInvitation.findFirst({
    where: {
      email,
      teamId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvite) {
    return errorResponse(
      "INVITE_PENDING",
      "An invitation has already been sent to this email.",
      409
    );
  }

  const team = await db.team.findUnique({
    where: { id: teamId },
    include: {
      owner: { select: { name: true } },
    },
  });

  if (!team) {
    return errorResponse("NOT_FOUND", "Team not found.", 404);
  }

  const inviter = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await db.teamInvitation.create({
    data: {
      email,
      teamId,
      token,
      expiresAt,
    },
  });

  // Send invitation email
  try {
    await sendTeamInvitationEmail(
      email,
      team.name,
      inviter?.name ?? "A team member",
      token
    );
  } catch (err) {
    // Log but don't fail - invitation is created
    console.error("Failed to send invitation email:", err);
  }

  return NextResponse.json(
    { data: { id: invitation.id, email, expiresAt } },
    { status: 201 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  const { id: teamId } = await params;
  const userId = session.user.id;

  // Only owner can remove members
  const requesterMember = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });

  if (!requesterMember || requesterMember.role !== "OWNER") {
    return errorResponse(
      "FORBIDDEN",
      "Only the team owner can remove members.",
      403
    );
  }

  const { searchParams } = new URL(request.url);
  const memberUserId = searchParams.get("userId");

  if (!memberUserId) {
    return errorResponse("INVALID_REQUEST", "userId query parameter required.", 400);
  }

  // Cannot remove yourself as owner
  if (memberUserId === userId) {
    return errorResponse(
      "INVALID_REQUEST",
      "Team owner cannot remove themselves.",
      400
    );
  }

  const targetMember = await db.teamMember.findUnique({
    where: { userId_teamId: { userId: memberUserId, teamId } },
  });

  if (!targetMember) {
    return errorResponse("NOT_FOUND", "Member not found in this team.", 404);
  }

  await db.teamMember.delete({
    where: { userId_teamId: { userId: memberUserId, teamId } },
  });

  return NextResponse.json({ data: { userId: memberUserId, teamId } });
}
