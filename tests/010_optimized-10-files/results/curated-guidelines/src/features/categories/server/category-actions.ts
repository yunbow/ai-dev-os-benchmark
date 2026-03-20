"use server";

import { prisma } from "@/lib/prisma/client";
import {
  withAction,
  requireAuth,
  createActionSuccess,
  ActionErrors,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type DeleteCategoryInput,
} from "../schema/category-schema";
import type { Category } from "@prisma/client";
import { TeamRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function verifyCategoryOwnership(
  categoryId: string,
  userId: string
): Promise<{ success: true; category: Category } | { success: false; error: { code: string; message: string } }> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) return ActionErrors.notFound("Category");

  if (category.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: category.teamId, userId } },
    });
    if (!membership || membership.role === TeamRole.VIEWER) {
      return ActionErrors.forbidden();
    }
  } else if (category.userId !== userId) {
    return ActionErrors.forbidden();
  }

  return { success: true, category };
}

export async function createCategory(
  data: CreateCategoryInput
): Promise<ActionResult<Category>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      if (validData.teamId) {
        const membership = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId: validData.teamId, userId: authResult.userId } },
        });
        if (!membership || membership.role === TeamRole.VIEWER) {
          return ActionErrors.forbidden();
        }
      }

      const category = await prisma.category.create({
        data: {
          name: validData.name,
          color: validData.color,
          userId: validData.teamId ? null : authResult.userId,
          teamId: validData.teamId ?? null,
        },
      });

      revalidatePath("/tasks");
      return createActionSuccess(category);
    },
    { data, schema: CreateCategorySchema }
  );
}

export async function listCategories(teamId?: string): Promise<ActionResult<Category[]>> {
  return withAction(
    async () => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const categories = await prisma.category.findMany({
        where: teamId
          ? { teamId }
          : { userId: authResult.userId },
        orderBy: { name: "asc" },
      });

      return createActionSuccess(categories);
    },
    {}
  );
}

export async function updateCategory(
  data: UpdateCategoryInput
): Promise<ActionResult<Category>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const ownershipResult = await verifyCategoryOwnership(validData.id, authResult.userId);
      if (!ownershipResult.success) return ownershipResult;

      const { id, ...rest } = validData;
      const category = await prisma.category.update({
        where: { id },
        data: rest,
      });

      revalidatePath("/tasks");
      return createActionSuccess(category);
    },
    { data, schema: UpdateCategorySchema }
  );
}

export async function deleteCategory(
  data: DeleteCategoryInput
): Promise<ActionResult<void>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const ownershipResult = await verifyCategoryOwnership(validData.id, authResult.userId);
      if (!ownershipResult.success) return ownershipResult;

      await prisma.category.delete({ where: { id: validData.id } });

      revalidatePath("/tasks");
      return createActionSuccess(undefined);
    },
    { data, schema: DeleteCategorySchema }
  );
}
