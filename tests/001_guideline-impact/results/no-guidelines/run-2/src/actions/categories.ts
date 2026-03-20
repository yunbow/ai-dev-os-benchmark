"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCategorySchema, updateCategorySchema } from "@/validations/category";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData): Promise<ActionResult<{
  id: string; name: string; color: string;
}>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  const raw = {
    name: formData.get("name"),
    color: formData.get("color"),
    teamId: formData.get("teamId") || undefined,
  };

  const parsed = createCategorySchema.safeParse(raw);
  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".") || "root";
      details[key] = [...(details[key] ?? []), e.message];
    });
    return { success: false, error: "Validation failed", details };
  }

  const { teamId, ...rest } = parsed.data;

  if (teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: session.user.id, teamId } },
    });
    if (!membership || membership.role === "VIEWER") {
      return { success: false, error: "Insufficient permissions" };
    }
  }

  const category = await prisma.category.create({
    data: {
      ...rest,
      userId: teamId ? null : session.user.id,
      teamId: teamId ?? null,
    },
    select: { id: true, name: true, color: true },
  });

  revalidatePath("/dashboard/categories");
  return { success: true, data: category };
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string; name: string; color: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return { success: false, error: "Category not found" };

  const canEdit = await canModifyCategory(session.user.id, category);
  if (!canEdit) return { success: false, error: "Insufficient permissions" };

  const raw = {
    name: formData.get("name") || undefined,
    color: formData.get("color") || undefined,
  };

  const parsed = updateCategorySchema.safeParse(raw);
  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".") || "root";
      details[key] = [...(details[key] ?? []), e.message];
    });
    return { success: false, error: "Validation failed", details };
  }

  const updated = await prisma.category.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, color: true },
  });

  revalidatePath("/dashboard/categories");
  return { success: true, data: updated };
}

export async function deleteCategory(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Authentication required" };

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return { success: false, error: "Category not found" };

  const canEdit = await canModifyCategory(session.user.id, category);
  if (!canEdit) return { success: false, error: "Insufficient permissions" };

  await prisma.category.delete({ where: { id } });
  revalidatePath("/dashboard/categories");
  return { success: true, data: undefined };
}

async function canModifyCategory(
  userId: string,
  category: { userId: string | null; teamId: string | null }
): Promise<boolean> {
  if (category.userId === userId) return true;

  if (category.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: category.teamId } },
    });
    return membership?.role === "OWNER" || membership?.role === "MEMBER";
  }

  return false;
}
