"use server";

import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/auth/session";
import {
  ActionResult,
  ActionErrors,
  createSuccess,
  createFailure,
} from "@/lib/actions/types";
import { categorySchema } from "@/features/categories/schema";
import type { Category } from "@prisma/client";

async function verifyCategoryOwnership(
  categoryId: string,
  userId: string
): Promise<{ allowed: boolean; category?: Category }> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) return { allowed: false };

  if (category.userId && category.userId !== userId) return { allowed: false };

  // Team category: check team membership
  if (category.teamId) {
    const member = await prisma.teamMember.findFirst({
      where: { teamId: category.teamId, userId },
    });
    if (!member) return { allowed: false };
  }

  return { allowed: true, category };
}

export async function listCategoriesAction(): Promise<ActionResult<Category[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId: authResult.user.id },
        {
          team: {
            members: { some: { userId: authResult.user.id } },
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return createSuccess(categories);
}

export async function createCategoryAction(input: unknown): Promise<ActionResult<Category>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return createFailure(parsed.error.issues[0].message);

  const { name, color, teamId } = parsed.data;

  // Sanitize color: only allow valid hex
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#000000";

  const category = await prisma.category.create({
    data: {
      name,
      color: safeColor,
      ...(teamId ? { teamId } : { userId: authResult.user.id }),
    },
  });

  return createSuccess(category);
}

export async function updateCategoryAction(
  categoryId: string,
  input: unknown
): Promise<ActionResult<Category>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const ownership = await verifyCategoryOwnership(categoryId, authResult.user.id);
  if (!ownership.allowed) return ActionErrors.forbidden();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return createFailure(parsed.error.issues[0].message);

  const { name, color } = parsed.data;
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#000000";

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: { name, color: safeColor },
  });

  return createSuccess(category);
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const ownership = await verifyCategoryOwnership(categoryId, authResult.user.id);
  if (!ownership.allowed) return ActionErrors.forbidden();

  await prisma.category.delete({ where: { id: categoryId } });
  return createSuccess(undefined);
}
