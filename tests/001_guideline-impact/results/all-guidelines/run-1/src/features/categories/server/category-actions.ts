"use server";

import { prisma } from "@/lib/prisma";
import {
  withAction,
  requireAuth,
  requireTeamMember,
  createActionSuccess,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "../schema/category-schema";
import type { Category } from "@prisma/client";

export async function createCategory(
  input: CreateCategoryInput
): Promise<ActionResult<Category>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const { teamId, ...rest } = validData!;

      if (teamId) {
        const memberResult = await requireTeamMember(
          teamId,
          authResult.userId,
          ["OWNER", "MEMBER"]
        );
        if (!memberResult.success) return memberResult;
      }

      const category = await prisma.category.create({
        data: {
          ...rest,
          userId: teamId ? null : authResult.userId,
          teamId: teamId ?? null,
        },
      });

      return createActionSuccess(category);
    },
    { data: input, schema: createCategorySchema }
  );
}

export async function listCategories(
  teamId?: string
): Promise<ActionResult<Category[]>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    if (teamId) {
      const memberResult = await requireTeamMember(teamId, authResult.userId);
      if (!memberResult.success) return memberResult;

      const categories = await prisma.category.findMany({
        where: { teamId },
        orderBy: { name: "asc" },
      });
      return createActionSuccess(categories);
    }

    const categories = await prisma.category.findMany({
      where: { userId: authResult.userId, teamId: null },
      orderBy: { name: "asc" },
    });
    return createActionSuccess(categories);
  });
}

export async function updateCategory(
  categoryId: string,
  input: UpdateCategoryInput
): Promise<ActionResult<Category>> {
  return withAction(
    async ({ validData }) => {
      const authResult = await requireAuth();
      if (!authResult.success) return authResult;

      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Category not found" },
        };
      }

      // IDOR prevention
      if (category.teamId) {
        const memberResult = await requireTeamMember(
          category.teamId,
          authResult.userId,
          ["OWNER", "MEMBER"]
        );
        if (!memberResult.success) return memberResult;
      } else if (category.userId !== authResult.userId) {
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied" },
        };
      }

      const updated = await prisma.category.update({
        where: { id: categoryId },
        data: validData!,
      });

      return createActionSuccess(updated);
    },
    { data: input, schema: updateCategorySchema }
  );
}

export async function deleteCategory(
  categoryId: string
): Promise<ActionResult<void>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Category not found" },
      };
    }

    // IDOR prevention
    if (category.teamId) {
      const memberResult = await requireTeamMember(
        category.teamId,
        authResult.userId,
        ["OWNER", "MEMBER"]
      );
      if (!memberResult.success) return memberResult;
    } else if (category.userId !== authResult.userId) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied" },
      };
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return createActionSuccess(undefined);
  });
}
