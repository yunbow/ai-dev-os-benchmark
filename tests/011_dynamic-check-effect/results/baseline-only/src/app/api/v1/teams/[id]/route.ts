import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTeamSchema } from "@/lib/validations/team";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  rateLimitResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { readRateLimit, writeRateLimit, getIpFromRequest } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = readRateLimit.check(`read:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: session.user.id, teamId: id } },
  });

  if (!membership) return notFoundResponse("Team");

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: { select: { members: true, tasks: true } },
    },
  });

  if (!team) return notFoundResponse("Team");
  return successResponse(team);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = writeRateLimit.check(`write:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;

  const team = await prisma.team.findUnique({ where: { id }, select: { ownerId: true } });
  if (!team) return notFoundResponse("Team");
  if (team.ownerId !== session.user.id) return forbiddenResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const updated = await prisma.team.update({
      where: { id },
      data: parsed.data,
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        _count: { select: { members: true, tasks: true } },
      },
    });
    return successResponse(updated);
  } catch {
    return internalErrorResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return unauthorizedResponse();

  const ip = getIpFromRequest(request);
  const rl = writeRateLimit.check(`write:${ip}`);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;

  const team = await prisma.team.findUnique({ where: { id }, select: { ownerId: true } });
  if (!team) return notFoundResponse("Team");
  if (team.ownerId !== session.user.id) return forbiddenResponse();

  await prisma.team.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
