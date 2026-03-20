"use server";

import { prisma } from "@/lib/prisma";
import { withAction, requireAuth, ActionErrors, createSuccess, ActionResult } from "@/lib/actions/action-helpers";
import { createCategorySchema, updateCategorySchema, CreateCategoryInput, UpdateCategoryInput } from "@/features/categories/schema/category-schema";
import { Category } from "@prisma/client";

export async function createCategory(input: CreateCategoryInput): Promise<ActionResult<Category>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const parsed = createCategorySchema.safeParse(input);
    if (!parsed.success) {
      return ActionErrors.validation(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    // Sanitize color - ensure it's a valid hex
    const color = parsed.data.color;

    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        color,
        userId: parsed.data.teamId ? null : authResult.userId,
        teamId: parsed.data.teamId ?? null,
      },
    });

    return createSuccess(category);
  });
}

export async function getCategories(teamId?: string): Promise<ActionResult<Category[]>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const categories = await prisma.category.findMany({
      where: teamId
        ? { teamId }
        : { userId: authResult.userId },
      orderBy: { name: "asc" },
    });

    return createSuccess(categories);
  });
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput): Promise<ActionResult<Category>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return ActionErrors.notFound("Category");

    if (category.userId !== authResult.userId) return ActionErrors.forbidden();

    const parsed = updateCategorySchema.safeParse(input);
    if (!parsed.success) {
      return ActionErrors.validation(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: parsed.data,
    });

    return createSuccess(updated);
  });
}

export async function deleteCategory(categoryId: string): Promise<ActionResult<void>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return ActionErrors.notFound("Category");

    if (category.userId !== authResult.userId) return ActionErrors.forbidden();

    await prisma.category.delete({ where: { id: categoryId } });

    return createSuccess(undefined);
  });
}
