import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateTeamSchema } from "@/validations/team";
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiInternalError,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = readRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.user.id, teamId: id } },
  });
  if (!membership) return apiForbidden();

  const team = await prisma.team.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      ownerId: true,
      createdAt: true,
      members: {
        select: {
          userId: true,
          role: true,
          joinedAt: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  if (!team) return apiNotFound("Team");
  return apiSuccess(team);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = writeRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.user.id, teamId: id } },
  });
  if (!membership || membership.role !== "OWNER") return apiForbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    const team = await prisma.team.update({
      where: { id },
      data: parsed.data,
      select: { id: true, name: true, ownerId: true, createdAt: true },
    });
    return apiSuccess(team);
  } catch {
    return apiInternalError();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = writeRateLimit(ip);
  if (!rl.success) return rateLimitResponse(rl.remaining);

  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const { id } = await params;

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return apiNotFound("Team");
  if (team.ownerId !== session.user.id) return apiForbidden();

  try {
    await prisma.team.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return apiInternalError();
  }
}
