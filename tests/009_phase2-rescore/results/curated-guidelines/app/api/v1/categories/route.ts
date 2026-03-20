import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/features/categories/schema/category-schema";

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

  const teamId = req.nextUrl.searchParams.get("teamId");

  const categories = await prisma.category.findMany({
    where: teamId ? { teamId } : { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: categories });
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

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      userId: parsed.data.teamId ? null : session.user.id,
      teamId: parsed.data.teamId ?? null,
    },
  });

  return NextResponse.json({ data: category }, { status: 201 });
}
