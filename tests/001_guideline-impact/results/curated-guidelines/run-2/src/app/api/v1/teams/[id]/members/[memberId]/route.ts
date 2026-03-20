import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { UpdateMemberRoleSchema } from "@/features/teams/schema/team-schema";
import { ActionErrors } from "@/lib/actions/errors";

function errorResponse(error: { code: string; message: string }, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse(ActionErrors.unauthorized(), 401);

  const rl = rateLimit(`api:write:${session.user.id}`, 30, 60000);
  if (!rl.success) return errorResponse(ActionErrors.rateLimited(), 429);

  const { id: teamId, memberId } = await params;

  const requesterMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });

  if (!requesterMembership || requesterMembership.role !== "OWNER") {
    return errorResponse(ActionErrors.forbidden(), 403);
  }

  const targetMember = await prisma.teamMember.findUnique({
    where: { id: memberId, teamId },
  });

  if (!targetMember) return errorResponse({ code: "NOT_FOUND", message: "Member not found" }, 404);

  const body = await req.json().catch(() => null);
  if (!body) return errorResponse(ActionErrors.badRequest("Invalid JSON"), 400);

  const parsed = UpdateMemberRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  if (targetMember.role === "OWNER" && parsed.data.role !== "OWNER") {
    const ownerCount = await prisma.teamMember.count({ where: { teamId, role: "OWNER" } });
    if (ownerCount <= 1) {
      return errorResponse({ code: "CONFLICT", message: "Cannot demote the last owner" }, 409);
    }
  }

  const updated = await prisma.teamMember.update({
    where: { id: memberId },
    data: { role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ data: updated }, { headers: rateLimitHeaders(rl) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse(ActionErrors.unauthorized(), 401);

  const rl = rateLimit(`api:write:${session.user.id}`, 30, 60000);
  if (!rl.success) return errorResponse(ActionErrors.rateLimited(), 429);

  const { id: teamId, memberId } = await params;

  const requesterMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });

  if (!requesterMembership) return errorResponse(ActionErrors.forbidden(), 403);

  const targetMember = await prisma.teamMember.findUnique({
    where: { id: memberId, teamId },
  });

  if (!targetMember) return errorResponse({ code: "NOT_FOUND", message: "Member not found" }, 404);

  const isSelf = targetMember.userId === session.user.id;
  if (!isSelf && requesterMembership.role !== "OWNER") {
    return errorResponse(ActionErrors.forbidden(), 403);
  }

  if (targetMember.role === "OWNER") {
    const ownerCount = await prisma.teamMember.count({ where: { teamId, role: "OWNER" } });
    if (ownerCount <= 1) {
      return errorResponse({ code: "CONFLICT", message: "Cannot remove the last owner" }, 409);
    }
  }

  await prisma.teamMember.delete({ where: { id: memberId } });
  return new NextResponse(null, { status: 204 });
}
