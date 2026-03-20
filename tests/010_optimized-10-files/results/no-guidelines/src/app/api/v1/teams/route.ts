import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamSchema } from "@/lib/validations";

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

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  const userId = session.user.id;

  const teams = await db.team.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      _count: {
        select: { members: true, tasks: true },
      },
      members: {
        where: { userId },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: teams });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("UNAUTHORIZED", "Authentication required.", 401);
  }

  const userId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "Invalid JSON in request body.", 400);
  }

  const parsed = teamSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "VALIDATION_ERROR",
      "Invalid team data.",
      400,
      parsed.error.issues
    );
  }

  // Create team and add owner as member in a transaction
  const team = await db.$transaction(async (tx) => {
    const newTeam = await tx.team.create({
      data: {
        name: parsed.data.name,
        ownerId: userId,
      },
    });

    await tx.teamMember.create({
      data: {
        userId,
        teamId: newTeam.id,
        role: "OWNER",
      },
    });

    return tx.team.findUnique({
      where: { id: newTeam.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: {
          select: { members: true, tasks: true },
        },
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });
  });

  return NextResponse.json({ data: team }, { status: 201 });
}
