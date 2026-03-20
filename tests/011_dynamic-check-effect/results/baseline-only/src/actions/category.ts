"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategorySchema, updateCategorySchema } from "@/lib/validations/category";
import type { ActionResult, CategoryWithCount } from "@/types";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/lib/validations/category";
import { sanitizeHexColor } from "@/lib/utils";
import { TeamRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(
  data: CreateCategoryInput
): Promise<ActionResult<CategoryWithCount>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = createCategorySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const safeColor = sanitizeHexColor(parsed.data.color);
  if (!safeColor) {
    return { success: false, error: "Invalid color format" };
  }

  // If team-scoped, check membership
  if (parsed.data.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: parsed.data.teamId },
      select: { ownerId: true },
    });

    if (!team) {
      return { success: false, error: "Team not found" };
    }

    let hasAccess = team.ownerId === session.user.id;
    if (!hasAccess) {
      const member = await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId: session.user.id, teamId: parsed.data.teamId } },
        select: { role: true },
      });
      hasAccess = member !== null && member.role !== TeamRole.VIEWER;
    }

    if (!hasAccess) {
      return { success: false, error: "You don't have permission to create categories for this team" };
    }
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      color: safeColor,
      userId: parsed.data.teamId ? null : session.user.id,
      teamId: parsed.data.teamId ?? null,
    },
    include: { _count: { select: { tasks: true } } },
  });

  revalidatePath("/categories");
  return { success: true, data: category };
}

export async function updateCategoryAction(
  id: string,
  data: UpdateCategoryInput
): Promise<ActionResult<CategoryWithCount>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = updateCategorySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const existing = await prisma.category.findUnique({
    where: { id },
    select: { userId: true, teamId: true },
  });

  if (!existing) {
    return { success: false, error: "Category not found" };
  }

  // Check ownership
  let canEdit = existing.userId === session.user.id;
  if (!canEdit && existing.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: existing.teamId },
      select: { ownerId: true },
    });
    canEdit = team?.ownerId === session.user.id;
  }

  if (!canEdit) {
    return { success: false, error: "You don't have permission to edit this category" };
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.color) {
    const safeColor = sanitizeHexColor(parsed.data.color);
    if (!safeColor) {
      return { success: false, error: "Invalid color format" };
    }
    updateData.color = safeColor;
  }

  const category = await prisma.category.update({
    where: { id },
    data: updateData,
    include: { _count: { select: { tasks: true } } },
  });

  revalidatePath("/categories");
  return { success: true, data: category };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const existing = await prisma.category.findUnique({
    where: { id },
    select: { userId: true, teamId: true },
  });

  if (!existing) {
    return { success: false, error: "Category not found" };
  }

  let canDelete = existing.userId === session.user.id;
  if (!canDelete && existing.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: existing.teamId },
      select: { ownerId: true },
    });
    canDelete = team?.ownerId === session.user.id;
  }

  if (!canDelete) {
    return { success: false, error: "You don't have permission to delete this category" };
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/categories");
  return { success: true, data: undefined };
}
