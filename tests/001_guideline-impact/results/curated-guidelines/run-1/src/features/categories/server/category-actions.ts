"use server";

import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/auth/require-auth";
import { withAction, ActionResult, ActionErrors } from "@/lib/actions/action-helpers";
import {
  createCategorySchema,
  updateCategorySchema,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../schema/category-schema";
import { Category } from "@prisma/client";

async function verifyCategoryAccess(
  categoryId: string,
  userId: string
): Promise<{ success: true; category: Category } | ReturnType<typeof ActionErrors.notFound>> {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return ActionErrors.notFound("Category");

  if (category.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: category.teamId } },
    });
    if (!membership) return ActionErrors.notFound("Category");
    if (membership.role === "VIEWER") return ActionErrors.forbidden();
  } else {
    if (category.userId !== userId) return ActionErrors.notFound("Category");
  }

  return { success: true, category };
}

export async function createCategoryAction(
  data: CreateCategoryInput
): Promise<ActionResult<Category>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      if (validData!.teamId) {
        const membership = await prisma.teamMember.findUnique({
          where: { userId_teamId: { userId: authResult.userId, teamId: validData!.teamId } },
        });
        if (!membership || membership.role === "VIEWER") return ActionErrors.forbidden();
      }

      const category = await prisma.category.create({
        data: {
          name: validData!.name,
          color: validData!.color,
          ...(validData!.teamId
            ? { teamId: validData!.teamId }
            : { userId: authResult.userId }),
        },
      });

      return { success: true, data: category };
    },
    { data, schema: createCategorySchema }
  );
}

export async function listCategoriesAction(teamId?: string): Promise<ActionResult<Category[]>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const categories = await prisma.category.findMany({
      where: teamId
        ? {
            teamId,
            team: { members: { some: { userId: authResult.userId } } },
          }
        : { userId: authResult.userId },
      orderBy: { name: "asc" },
    });

    return { success: true, data: categories };
  });
}

export async function updateCategoryAction(
  categoryId: string,
  data: UpdateCategoryInput
): Promise<ActionResult<Category>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const access = await verifyCategoryAccess(categoryId, authResult.userId);
      if (!access.success) return access;

      const category = await prisma.category.update({
        where: { id: categoryId },
        data: validData!,
      });

      return { success: true, data: category };
    },
    { data, schema: updateCategorySchema }
  );
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult<void>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const access = await verifyCategoryAccess(categoryId, authResult.userId);
    if (!access.success) return access;

    await prisma.category.delete({ where: { id: categoryId } });

    return { success: true, data: undefined };
  });
}
