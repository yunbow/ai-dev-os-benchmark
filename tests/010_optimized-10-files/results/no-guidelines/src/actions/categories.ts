"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validations";
import type { ActionResult } from "@/actions/auth";
import type { Category } from "@prisma/client";

type CategoryWithCount = Category & { _count: { tasks: number } };

export async function createCategory(
  data: unknown
): Promise<ActionResult<CategoryWithCount>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;
  const parsed = categorySchema.safeParse(data);

  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      if (!details[field]) details[field] = [];
      details[field].push(issue.message);
    });
    return { success: false, error: "Validation failed", details };
  }

  const { teamId, ...rest } = parsed.data;

  // Verify team membership if teamId provided
  if (teamId) {
    const member = await db.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!member || member.role === "VIEWER") {
      return {
        success: false,
        error: "You do not have permission to create categories in this team.",
      };
    }
  }

  const category = await db.category.create({
    data: {
      ...rest,
      userId: teamId ? null : userId,
      teamId: teamId ?? null,
    },
    include: { _count: { select: { tasks: true } } },
  });

  return { success: true, data: category };
}

export async function updateCategory(
  id: string,
  data: unknown
): Promise<ActionResult<CategoryWithCount>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;

  const category = await db.category.findFirst({
    where: {
      id,
      OR: [
        { userId },
        { team: { members: { some: { userId, role: { in: ["OWNER", "MEMBER"] } } } } },
      ],
    },
  });

  if (!category) {
    return { success: false, error: "Category not found or permission denied." };
  }

  const parsed = categorySchema.partial().safeParse(data);
  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      if (!details[field]) details[field] = [];
      details[field].push(issue.message);
    });
    return { success: false, error: "Validation failed", details };
  }

  const { teamId: _teamId, ...updateData } = parsed.data;

  const updated = await db.category.update({
    where: { id },
    data: updateData,
    include: { _count: { select: { tasks: true } } },
  });

  return { success: true, data: updated };
}

export async function deleteCategory(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;

  const category = await db.category.findFirst({
    where: {
      id,
      OR: [
        { userId },
        { team: { members: { some: { userId, role: "OWNER" } } } },
      ],
    },
  });

  if (!category) {
    return { success: false, error: "Category not found or permission denied." };
  }

  await db.category.delete({ where: { id } });

  return { success: true, data: { id } };
}

export async function getCategories(teamId?: string): Promise<ActionResult<CategoryWithCount[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required." };
  }

  const userId = session.user.id;

  const categories = await db.category.findMany({
    where: {
      OR: [
        { userId },
        { team: { members: { some: { userId } } } },
      ],
      ...(teamId ? { teamId } : {}),
    },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: categories };
}
