"use server";

import { prisma } from "@/lib/prisma";
import {
  ActionErrors,
  createActionSuccess,
  handleActionError,
  requireAuth,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import { CategorySchema, UpdateCategorySchema, type CategoryInput, type UpdateCategoryInput } from "../schema/category-schema";

type Category = {
  id: string;
  name: string;
  color: string;
  userId: string | null;
  teamId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function createCategoryAction(input: CategoryInput): Promise<ActionResult<Category>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const validated = CategorySchema.parse(input);

    if (validated.teamId) {
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: authResult.userId, teamId: validated.teamId } },
      });
      if (!member || member.role === "VIEWER") return ActionErrors.forbidden();
    }

    const category = await prisma.category.create({
      data: {
        ...validated,
        userId: validated.teamId ? null : authResult.userId,
      },
    });

    return createActionSuccess(category);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateCategoryAction(input: UpdateCategoryInput): Promise<ActionResult<Category>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const validated = UpdateCategorySchema.parse(input);
    const { id, ...data } = validated;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return ActionErrors.notFound("Category");

    if (existing.userId && existing.userId !== authResult.userId) return ActionErrors.forbidden();
    if (existing.teamId) {
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: authResult.userId, teamId: existing.teamId } },
      });
      if (!member || member.role === "VIEWER") return ActionErrors.forbidden();
    }

    const category = await prisma.category.update({ where: { id }, data });
    return createActionSuccess(category);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult<void>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return ActionErrors.notFound("Category");

    if (category.userId && category.userId !== authResult.userId) return ActionErrors.forbidden();
    if (category.teamId) {
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: authResult.userId, teamId: category.teamId } },
      });
      if (!member || member.role === "VIEWER") return ActionErrors.forbidden();
    }

    await prisma.category.delete({ where: { id: categoryId } });
    return createActionSuccess(undefined);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getCategoriesAction(teamId?: string): Promise<ActionResult<Category[]>> {
  try {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const categories = await prisma.category.findMany({
      where: teamId
        ? { teamId }
        : { userId: authResult.userId, teamId: null },
      orderBy: { name: "asc" },
    });

    return createActionSuccess(categories);
  } catch (error) {
    return handleActionError(error);
  }
}
