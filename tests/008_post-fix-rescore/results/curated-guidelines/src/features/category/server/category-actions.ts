"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  actionSuccess,
  actionForbidden,
  actionNotFound,
  actionInternalError,
  actionValidationError,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from "@/features/category/schema/category-schema";
import { type Category } from "@prisma/client";

export async function createCategory(
  rawInput: unknown
): Promise<ActionResult<Category>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  const parsed = CreateCategorySchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(e.message);
    });
    return actionValidationError("Invalid input", fieldErrors);
  }

  const { name, color, teamId } = parsed.data;

  try {
    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
      });
      if (!membership) return actionForbidden();
    }

    const category = await prisma.category.create({
      data: {
        name,
        color: color.toUpperCase(),
        userId: teamId ? null : userId,
        teamId: teamId ?? null,
      },
    });

    return actionSuccess(category);
  } catch {
    return actionInternalError();
  }
}

export async function listCategories(
  teamId?: string
): Promise<ActionResult<Category[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  try {
    let categories: Category[];

    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
      });
      if (!membership) return actionForbidden();

      categories = await prisma.category.findMany({
        where: { teamId },
        orderBy: { name: "asc" },
      });
    } else {
      categories = await prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      });
    }

    return actionSuccess(categories);
  } catch {
    return actionInternalError();
  }
}

export async function updateCategory(
  categoryId: unknown,
  rawInput: unknown
): Promise<ActionResult<Category>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  if (typeof categoryId !== "string") {
    return actionValidationError("Invalid category ID");
  }

  const parsed = UpdateCategorySchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(e.message);
    });
    return actionValidationError("Invalid input", fieldErrors);
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) return actionNotFound("Category");

    // IDOR check
    if (category.userId && category.userId !== userId) {
      return actionForbidden();
    }

    if (category.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: category.teamId, userId } },
      });
      if (!membership || membership.role === "VIEWER") return actionForbidden();
    }

    const { color, ...rest } = parsed.data;
    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...rest,
        ...(color ? { color: color.toUpperCase() } : {}),
      },
    });

    return actionSuccess(updated);
  } catch {
    return actionInternalError();
  }
}

export async function deleteCategory(
  categoryId: unknown
): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId } = authResult;

  if (typeof categoryId !== "string") {
    return actionValidationError("Invalid category ID");
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) return actionNotFound("Category");

    if (category.userId && category.userId !== userId) {
      return actionForbidden();
    }

    if (category.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: category.teamId, userId } },
      });
      if (!membership || membership.role === "VIEWER") return actionForbidden();
    }

    await prisma.category.delete({ where: { id: categoryId } });
    return actionSuccess(undefined);
  } catch {
    return actionInternalError();
  }
}
