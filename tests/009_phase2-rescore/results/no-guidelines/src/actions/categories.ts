"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createCategorySchema, updateCategorySchema } from "@/lib/validations/category";
import { actionSuccess, actionError } from "@/lib/api-response";
import { TeamRole } from "@prisma/client";

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export async function createCategoryAction(formData: FormData) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const raw = {
    name: formData.get("name"),
    color: formData.get("color"),
    teamId: formData.get("teamId") || undefined,
  };

  const parsed = createCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { teamId, ...rest } = parsed.data;

  if (teamId) {
    const member = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (!member || member.role === TeamRole.VIEWER) {
      return actionError("Insufficient permissions");
    }
  }

  const category = await db.category.create({
    data: {
      ...rest,
      userId: teamId ? null : session.user.id,
      teamId: teamId ?? null,
    },
  });

  revalidatePath("/categories");

  return actionSuccess(category);
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const category = await db.category.findUnique({
    where: { id: categoryId },
    include: {
      team: { include: { members: { where: { userId: session.user.id } } } },
    },
  });

  if (!category) return actionError("Category not found");

  const isOwner = category.userId === session.user.id;
  const isTeamAdmin = category.team?.members[0]?.role === TeamRole.OWNER;

  if (!isOwner && !isTeamAdmin) return actionError("Insufficient permissions");

  const raw = {
    name: formData.get("name") || undefined,
    color: formData.get("color") || undefined,
  };

  const parsed = updateCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const updated = await db.category.update({
    where: { id: categoryId },
    data: parsed.data,
  });

  revalidatePath("/categories");

  return actionSuccess(updated);
}

export async function deleteCategoryAction(categoryId: string) {
  const session = await getSession();
  if (!session) return actionError("Authentication required");

  const category = await db.category.findUnique({
    where: { id: categoryId },
    include: {
      team: { include: { members: { where: { userId: session.user.id } } } },
    },
  });

  if (!category) return actionError("Category not found");

  const isOwner = category.userId === session.user.id;
  const isTeamAdmin = category.team?.members[0]?.role === TeamRole.OWNER;

  if (!isOwner && !isTeamAdmin) return actionError("Insufficient permissions");

  await db.category.delete({ where: { id: categoryId } });

  revalidatePath("/categories");

  return actionSuccess(undefined);
}
