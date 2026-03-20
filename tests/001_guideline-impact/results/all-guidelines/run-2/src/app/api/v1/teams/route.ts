import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, setRateLimitHeaders } from "@/lib/api/rate-limit";
import { CreateTeamSchema } from "@/features/teams/schema/team-schema";
import { ZodError } from "zod";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message, details: [] } }, { status });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: teams, nextCursor: null, hasMore: false });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`write:${ip}`, "write");
  const headers = new Headers();
  setRateLimitHeaders(headers, rl);
  if (!rl.allowed) return NextResponse.json({ error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests", details: [] } }, { status: 429, headers });

  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  try {
    const body = await req.json();
    const validated = CreateTeamSchema.parse(body);

    const team = await prisma.team.create({
      data: {
        name: validated.name,
        ownerId: session.user.id,
        members: { create: { userId: session.user.id, role: "OWNER" } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    return NextResponse.json(team, { status: 201, headers });
  } catch (error) {
    if (error instanceof ZodError) return errorResponse("VALIDATION_ERROR", "Invalid request body", 400);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
