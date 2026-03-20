"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validations/category";
import type { ActionResult } from "@/lib/utils";
import type { Category } from "@prisma/client";

export async function getCategories(teamId?: string): Promise<
  ActionResult<Category[]>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const where = teamId
      ? {
          teamId,
          team: {
            members: { some: { userId: session.user.id } },
          },
        }
      : { userId: session.user.id, teamId: null };

    const categories = await db.category.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error("getCategories error:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}

export async function createCategory(
  rawData: unknown
): Promise<ActionResult<Category>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createCategorySchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((err) => {
      const key = err.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(err.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { teamId, color, ...rest } = parsed.data;

  // Extra server-side color validation (prevent XSS)
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#6366f1";

  try {
    // Verify team membership for team categories
    if (teamId) {
      const membership = await db.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: session.user.id } },
      });
      if (!membership || membership.role === "VIEWER") {
        return { success: false, error: "Insufficient permissions" };
      }
    }

    // Check for duplicate name within scope
    const existing = await db.category.findFirst({
      where: teamId
        ? { teamId, name: { equals: rest.name, mode: "insensitive" } }
        : {
            userId: session.user.id,
            teamId: null,
            name: { equals: rest.name, mode: "insensitive" },
          },
    });

    if (existing) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: { name: ["A category with this name already exists"] },
      };
    }

    const category = await db.category.create({
      data: {
        ...rest,
        color: safeColor,
        userId: teamId ? null : session.user.id,
        teamId: teamId ?? null,
      },
    });

    revalidatePath("/categories");
    return {
      success: true,
      data: category,
      message: "Category created successfully",
    };
  } catch (error) {
    console.error("createCategory error:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(
  categoryId: string,
  rawData: unknown
): Promise<ActionResult<Category>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateCategorySchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((err) => {
      const key = err.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(err.message);
    });
    return { success: false, error: "Validation failed", fieldErrors };
  }

  try {
    // IDOR protection: verify ownership
    const existingCategory = await db.category.findFirst({
      where: {
        id: categoryId,
        OR: [
          { userId: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ["OWNER", "MEMBER"] },
                },
              },
            },
          },
        ],
      },
    });

    if (!existingCategory) {
      return { success: false, error: "Category not found or access denied" };
    }

    const { color, ...rest } = parsed.data;
    const safeColor =
      color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : undefined;

    const category = await db.category.update({
      where: { id: categoryId },
      data: {
        ...rest,
        ...(safeColor && { color: safeColor }),
      },
    });

    revalidatePath("/categories");
    return {
      success: true,
      data: category,
      message: "Category updated successfully",
    };
  } catch (error) {
    console.error("updateCategory error:", error);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(
  categoryId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // IDOR protection
    const category = await db.category.findFirst({
      where: {
        id: categoryId,
        OR: [
          { userId: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ["OWNER"] },
                },
              },
            },
          },
        ],
      },
    });

    if (!category) {
      return { success: false, error: "Category not found or access denied" };
    }

    await db.category.delete({ where: { id: categoryId } });

    revalidatePath("/categories");
    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error("deleteCategory error:", error);
    return { success: false, error: "Failed to delete category" };
  }
}
