import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { updateTeamSchema } from "@/lib/validations/team";
import {
  apiSuccess,
  zodErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  rateLimitResponse,
  invalidBodyResponse,
} from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`read:${ip}`, RATE_LIMITS.read.limit, RATE_LIMITS.read.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const userId = session.user.id;

  const team = await db.team.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!team) return notFoundResponse("Team");

  const isMember = team.members.some((m) => m.userId === userId);
  if (!isMember) return forbiddenResponse();

  return apiSuccess(team);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`write:${ip}`, RATE_LIMITS.write.limit, RATE_LIMITS.write.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const userId = session.user.id;

  const member = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: id } },
  });
  if (!member) return notFoundResponse("Team");
  if (member.role !== "OWNER") return forbiddenResponse();

  const body = await req.json().catch(() => null);
  if (!body) return invalidBodyResponse();

  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const team = await db.team.update({ where: { id }, data: parsed.data });
  return apiSuccess(team);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`write:${ip}`, RATE_LIMITS.write.limit, RATE_LIMITS.write.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { id } = await params;
  const userId = session.user.id;

  const member = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: id } },
  });
  if (!member) return notFoundResponse("Team");
  if (member.role !== "OWNER") return forbiddenResponse();

  await db.team.delete({ where: { id } });
  return apiSuccess({ message: "Team deleted" });
}
