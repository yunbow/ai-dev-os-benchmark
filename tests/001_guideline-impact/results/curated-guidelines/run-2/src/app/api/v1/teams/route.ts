import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { CreateTeamSchema } from "@/features/teams/schema/team-schema";
import { ActionErrors } from "@/lib/actions/errors";

function errorResponse(error: { code: string; message: string }, status: number) {
  return NextResponse.json({ error }, { status });
}

const teamInclude = {
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse(ActionErrors.unauthorized(), 401);

  const rl = rateLimit(`api:read:${session.user.id}`, 100, 60000);
  if (!rl.success) return errorResponse(ActionErrors.rateLimited(), 429);

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: teamInclude,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: teams }, { headers: rateLimitHeaders(rl) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse(ActionErrors.unauthorized(), 401);

  const rl = rateLimit(`api:write:${session.user.id}`, 30, 60000);
  if (!rl.success) return errorResponse(ActionErrors.rateLimited(), 429);

  const body = await req.json().catch(() => null);
  if (!body) return errorResponse(ActionErrors.badRequest("Invalid JSON"), 400);

  const parsed = CreateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
    include: teamInclude,
  });

  return NextResponse.json({ data: team }, { status: 201, headers: rateLimitHeaders(rl) });
}
