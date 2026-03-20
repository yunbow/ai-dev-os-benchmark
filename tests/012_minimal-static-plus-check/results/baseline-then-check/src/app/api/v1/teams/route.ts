import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTeamSchema } from "@/lib/validations";
import { readRateLimit, writeRateLimit } from "@/lib/rate-limit";

function errorResponse(
  code: string,
  message: string,
  details: unknown[] = [],
  status = 400
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export async function GET(req: NextRequest) {
  const rateLimitResponse = readRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401);
  }

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: teams });
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = writeRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required", [], 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_REQUEST", "Invalid JSON body");
  }

  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", parsed.error.issues);
  }

  const { name, description } = parsed.data;

  const team = await prisma.team.create({
    data: {
      name,
      description,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json({ data: team }, { status: 201 });
}
