import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateTeamSchema } from "@/lib/validations/team";
import {
  apiSuccess,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiInternalError,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";
import { TeamRole } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = readRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  const team = await db.team.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!team) return apiNotFound("Team not found");

  const isMember = team.members.some((m) => m.user.id === session.user.id);
  if (!isMember) return apiForbidden();

  return apiSuccess(team);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = writeRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId: id, userId: session.user.id } },
  });
  if (!member || member.role !== TeamRole.OWNER) return apiForbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiNotFound();
  }

  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error.errors);

  try {
    const updated = await db.team.update({ where: { id }, data: parsed.data });
    return apiSuccess(updated);
  } catch {
    return apiInternalError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = writeRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId: id, userId: session.user.id } },
  });
  if (!member || member.role !== TeamRole.OWNER) return apiForbidden();

  try {
    await db.team.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return apiInternalError();
  }
}
