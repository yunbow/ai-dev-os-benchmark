"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/lib/validations";
import type { ActionResult } from "@/lib/utils";
import { Category } from "@prisma/client";

async function verifyCategoryAccess(
  categoryId: string,
  userId: string
): Promise<{ category: Category | null; canModify: boolean }> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      team: {
        include: {
          members: {
            where: { userId },
            select: { role: true },
          },
        },
      },
    },
  });

  if (!category) return { category: null, canModify: false };

  if (category.userId === userId) {
    return { category, canModify: true };
  }

  if (category.teamId) {
    const team = category.team as { members: { role: string }[] } | null;
    const membership = team?.members[0];
    if (membership && (membership.role === "OWNER" || membership.role === "MEMBER")) {
      return { category, canModify: true };
    }
  }

  return { category, canModify: false };
}

export async function createCategory(
  input: CreateCategoryInput
): Promise<ActionResult<Category>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { name, color, teamId } = parsed.data;

  // If teamId, verify membership
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!membership || membership.role === "VIEWER") {
      return { success: false, error: "Insufficient permissions" };
    }
  }

  const category = await prisma.category.create({
    data: {
      name,
      color,
      userId: teamId ? null : session.user.id,
      teamId: teamId || null,
    },
  });

  return { success: true, data: category };
}

export async function updateCategory(
  input: UpdateCategoryInput
): Promise<ActionResult<Category>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { id, ...data } = parsed.data;

  const { category, canModify } = await verifyCategoryAccess(id, session.user.id);

  if (!category) return { success: false, error: "Category not found" };
  if (!canModify) return { success: false, error: "Insufficient permissions" };

  const updated = await prisma.category.update({
    where: { id },
    data,
  });

  return { success: true, data: updated };
}

export async function deleteCategory(
  categoryId: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const { category, canModify } = await verifyCategoryAccess(
    categoryId,
    session.user.id
  );

  if (!category) return { success: false, error: "Category not found" };
  if (!canModify) return { success: false, error: "Insufficient permissions" };

  await prisma.category.delete({ where: { id: categoryId } });

  return { success: true, data: undefined };
}

export async function getCategories(
  teamId?: string
): Promise<ActionResult<Category[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!membership) {
      return { success: false, error: "Insufficient permissions" };
    }

    const categories = await prisma.category.findMany({
      where: { teamId },
      orderBy: { name: "asc" },
    });
    return { success: true, data: categories };
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return { success: true, data: categories };
}
