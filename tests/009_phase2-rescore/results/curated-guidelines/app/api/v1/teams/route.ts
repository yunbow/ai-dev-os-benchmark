import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTeamSchema } from "@/features/teams/schema/team-schema";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET() {
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

  return NextResponse.json({ data: teams });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON body", 400);
  }

  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      members: { create: { userId: session.user.id, role: "OWNER" } },
    },
  });

  return NextResponse.json({ data: team }, { status: 201 });
}
