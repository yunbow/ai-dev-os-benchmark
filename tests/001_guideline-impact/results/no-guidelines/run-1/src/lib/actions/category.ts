"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { CreateCategorySchema, UpdateCategorySchema } from "@/lib/validations/category";
import * as categoryService from "@/lib/services/category.service";
import type { ActionResult } from "@/types";

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function createCategory(formData: FormData): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const raw = {
    name: formData.get("name"),
    color: formData.get("color"),
    teamId: formData.get("teamId") || undefined,
  };

  const parsed = CreateCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const category = await categoryService.createCategory(parsed.data, userId);
    revalidatePath("/categories");
    return { success: true, data: category };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "FORBIDDEN") return { success: false, error: "Access denied" };
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(id: string, formData: FormData): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const raw = {
    name: formData.get("name") || undefined,
    color: formData.get("color") || undefined,
  };

  const parsed = UpdateCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const category = await categoryService.updateCategory(id, parsed.data, userId);
    revalidatePath("/categories");
    return { success: true, data: category };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_FOUND") return { success: false, error: "Category not found" };
    if (message === "FORBIDDEN") return { success: false, error: "Access denied" };
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  try {
    await categoryService.deleteCategory(id, userId);
    revalidatePath("/categories");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_FOUND") return { success: false, error: "Category not found" };
    if (message === "FORBIDDEN") return { success: false, error: "Access denied" };
    return { success: false, error: "Failed to delete category" };
  }
}
