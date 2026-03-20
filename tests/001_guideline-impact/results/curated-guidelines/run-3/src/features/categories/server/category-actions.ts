"use server";

import { prisma } from "@/lib/prisma/client";
import {
  actionSuccess,
  actionFailure,
  withAction,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import { requireAuth, checkOwnership } from "@/lib/actions/auth-helpers";
import {
  CategorySchema,
  UpdateCategorySchema,
  type CategoryInput,
  type UpdateCategoryInput,
} from "../schema/category-schema";
import type { Category } from "@prisma/client";

export async function createCategory(
  data: CategoryInput
): Promise<ActionResult<Category>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const parsed = CategorySchema.safeParse(data);
    if (!parsed.success) {
      return actionFailure("VALIDATION_ERROR", "Invalid category data.", {
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      });
    }

    const { name, color, teamId } = parsed.data;
    const userId = authResult.session.user.id;

    // Verify team membership if teamId provided
    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId } },
        select: { role: true },
      });
      if (!membership) {
        return actionFailure("FORBIDDEN", "You are not a member of this team.");
      }
      if (membership.role === "VIEWER") {
        return actionFailure("FORBIDDEN", "Viewers cannot create categories.");
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        color,
        ...(teamId ? { teamId } : { userId }),
      },
    });

    return actionSuccess(category);
  });
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryInput
): Promise<ActionResult<Category>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const parsed = UpdateCategorySchema.safeParse(data);
    if (!parsed.success) {
      return actionFailure("VALIDATION_ERROR", "Invalid category data.", {
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      });
    }

    const userId = authResult.session.user.id;
    const userRole = authResult.session.user.role;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
      select: { userId: true, teamId: true },
    });

    if (!existingCategory) {
      return actionFailure("NOT_FOUND", "Category not found.");
    }

    if (existingCategory.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId: existingCategory.teamId } },
        select: { role: true },
      });
      if (!membership) {
        return actionFailure("FORBIDDEN", "You are not a member of this team.");
      }
      if (membership.role === "VIEWER") {
        return actionFailure("FORBIDDEN", "Viewers cannot update categories.");
      }
    } else {
      const ownershipError = checkOwnership({
        resourceUserId: existingCategory.userId ?? "",
        currentUserId: userId,
        currentUserRole: userRole,
        adminBypass: true,
      });
      if (ownershipError) return ownershipError;
    }

    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    return actionSuccess(category);
  });
}

export async function deleteCategory(id: string): Promise<ActionResult<{ id: string }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const userId = authResult.session.user.id;
    const userRole = authResult.session.user.role;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
      select: { userId: true, teamId: true },
    });

    if (!existingCategory) {
      return actionFailure("NOT_FOUND", "Category not found.");
    }

    if (existingCategory.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId: existingCategory.teamId } },
        select: { role: true },
      });
      if (!membership) {
        return actionFailure("FORBIDDEN", "You are not a member of this team.");
      }
      if (membership.role !== "OWNER") {
        return actionFailure("FORBIDDEN", "Only team owners can delete categories.");
      }
    } else {
      const ownershipError = checkOwnership({
        resourceUserId: existingCategory.userId ?? "",
        currentUserId: userId,
        currentUserRole: userRole,
        adminBypass: true,
      });
      if (ownershipError) return ownershipError;
    }

    await prisma.category.delete({ where: { id } });

    return actionSuccess({ id });
  });
}

export async function getCategories(
  teamId?: string
): Promise<ActionResult<Category[]>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.error;

    const userId = authResult.session.user.id;

    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId } },
        select: { role: true },
      });
      if (!membership) {
        return actionFailure("FORBIDDEN", "You are not a member of this team.");
      }

      const categories = await prisma.category.findMany({
        where: { teamId },
        orderBy: { name: "asc" },
      });
      return actionSuccess(categories);
    }

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });

    return actionSuccess(categories);
  });
}
