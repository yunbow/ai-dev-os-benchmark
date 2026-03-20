"use server";

import { prisma } from "@/lib/prisma";
import { ActionErrors } from "@/lib/errors";
import { requireAuth, requireCategoryOwnership } from "./auth-helpers";
import { createCategorySchema, updateCategorySchema, sanitizeColor } from "@/lib/validations/category";
import type { ActionResult, CategoryWithCount } from "@/lib/types";

export async function createCategory(
  formData: FormData,
): Promise<ActionResult<CategoryWithCount>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId } = authResult.data;

  const raw = {
    name: formData.get("name"),
    color: formData.get("color"),
    teamId: formData.get("teamId") || null,
  };

  const parsed = createCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  const { name, color, teamId } = parsed.data;

  // Sanitize and validate color (XSS prevention)
  let sanitizedColor: string;
  try {
    sanitizedColor = sanitizeColor(color);
  } catch {
    return { success: false, error: ActionErrors.INVALID_COLOR };
  }

  // If teamId provided, verify user has team access
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!membership || membership.role === "VIEWER") {
      return { success: false, error: ActionErrors.TEAM_ACCESS_DENIED };
    }
  }

  try {
    const category = await prisma.category.create({
      data: {
        name,
        color: sanitizedColor,
        userId: teamId ? null : userId,
        teamId: teamId ?? null,
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    return { success: true, data: category as CategoryWithCount };
  } catch {
    return { success: false, error: ActionErrors.DATABASE_ERROR };
  }
}

export async function updateCategory(
  categoryId: string,
  formData: FormData,
): Promise<ActionResult<CategoryWithCount>> {
  const ownerResult = await requireCategoryOwnership(categoryId);
  if (!ownerResult.success) return ownerResult;

  const raw = {
    name: formData.get("name") || undefined,
    color: formData.get("color") || undefined,
  };

  const parsed = updateCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  const { name, color } = parsed.data;

  let sanitizedColor: string | undefined;
  if (color) {
    try {
      sanitizedColor = sanitizeColor(color);
    } catch {
      return { success: false, error: ActionErrors.INVALID_COLOR };
    }
  }

  try {
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(name ? { name } : {}),
        ...(sanitizedColor ? { color: sanitizedColor } : {}),
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    return { success: true, data: category as CategoryWithCount };
  } catch {
    return { success: false, error: ActionErrors.DATABASE_ERROR };
  }
}

export async function deleteCategory(
  categoryId: string,
): Promise<ActionResult<{ deleted: boolean }>> {
  const ownerResult = await requireCategoryOwnership(categoryId);
  if (!ownerResult.success) return ownerResult;

  try {
    await prisma.category.delete({ where: { id: categoryId } });
    return { success: true, data: { deleted: true } };
  } catch {
    return { success: false, error: ActionErrors.DATABASE_ERROR };
  }
}

export async function getCategories(
  teamId?: string,
): Promise<ActionResult<CategoryWithCount[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId } = authResult.data;

  // If teamId provided, verify membership
  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!membership) {
      return { success: false, error: ActionErrors.TEAM_ACCESS_DENIED };
    }
  }

  const where = teamId
    ? { teamId }
    : { userId };

  const categories = await prisma.category.findMany({
    where,
    include: {
      _count: { select: { tasks: true } },
    },
    orderBy: { name: "asc" },
  });

  return { success: true, data: categories as CategoryWithCount[] };
}
