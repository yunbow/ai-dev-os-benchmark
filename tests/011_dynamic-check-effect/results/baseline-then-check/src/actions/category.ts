"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema, updateCategorySchema } from "@/lib/validations/category";
import type { ActionResult } from "@/types";
import { Category, TeamRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createCategory(formData: FormData): Promise<ActionResult<Category>> {
  const userId = await getAuthenticatedUserId();

  const raw = {
    name: formData.get("name"),
    color: formData.get("color"),
    teamId: formData.get("teamId") || undefined,
  };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    if (parsed.data.teamId) {
      const member = await db.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId: parsed.data.teamId } },
      });
      if (!member || member.role === TeamRole.VIEWER) {
        return { success: false, error: "Forbidden" };
      }
    }

    const category = await db.category.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color,
        userId: parsed.data.teamId ? null : userId,
        teamId: parsed.data.teamId ?? null,
      },
    });

    revalidatePath("/categories");
    return { success: true, data: category };
  } catch (err) {
    console.error("createCategory DB error:", err);
    return { success: false, error: "Failed to create category. Please try again." };
  }
}

export async function updateCategory(
  categoryId: string,
  formData: FormData
): Promise<ActionResult<Category>> {
  const userId = await getAuthenticatedUserId();

  try {
    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) return { success: false, error: "Category not found" };
    if (category.userId && category.userId !== userId) return { success: false, error: "Forbidden" };
    if (category.teamId) {
      const member = await db.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId: category.teamId } },
      });
      if (!member || member.role === TeamRole.VIEWER) return { success: false, error: "Forbidden" };
    }

    const raw = {
      name: formData.get("name") || undefined,
      color: formData.get("color") || undefined,
    };

    const parsed = updateCategorySchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const updated = await db.category.update({
      where: { id: categoryId },
      data: parsed.data,
    });

    revalidatePath("/categories");
    return { success: true, data: updated };
  } catch (err) {
    console.error("updateCategory DB error:", err);
    return { success: false, error: "Failed to update category. Please try again." };
  }
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();

  try {
    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) return { success: false, error: "Category not found" };
    if (category.userId && category.userId !== userId) return { success: false, error: "Forbidden" };
    if (category.teamId) {
      const member = await db.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId: category.teamId } },
      });
      if (!member || member.role === TeamRole.VIEWER) return { success: false, error: "Forbidden" };
    }

    await db.category.delete({ where: { id: categoryId } });
    revalidatePath("/categories");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("deleteCategory DB error:", err);
    return { success: false, error: "Failed to delete category. Please try again." };
  }
}
