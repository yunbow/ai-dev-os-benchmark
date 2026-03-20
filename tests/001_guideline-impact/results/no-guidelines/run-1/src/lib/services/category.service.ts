import { db } from "@/lib/db";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/lib/validations/category";
import type { Category } from "@prisma/client";

async function getMemberRole(userId: string, teamId: string) {
  const member = await db.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });
  return member?.role ?? null;
}

export async function getCategories(
  userId: string,
  teamId?: string | null
): Promise<Category[]> {
  if (teamId) {
    const role = await getMemberRole(userId, teamId);
    if (!role) throw new Error("FORBIDDEN");
    return db.category.findMany({ where: { teamId }, orderBy: { name: "asc" } });
  }
  return db.category.findMany({ where: { userId, teamId: null }, orderBy: { name: "asc" } });
}

export async function getCategoryById(id: string, userId: string): Promise<Category> {
  const category = await db.category.findUnique({ where: { id } });
  if (!category) throw new Error("NOT_FOUND");

  if (category.teamId) {
    const role = await getMemberRole(userId, category.teamId);
    if (!role) throw new Error("FORBIDDEN");
  } else if (category.userId !== userId) {
    throw new Error("FORBIDDEN");
  }

  return category;
}

export async function createCategory(
  data: CreateCategoryInput,
  userId: string
): Promise<Category> {
  if (data.teamId) {
    const role = await getMemberRole(userId, data.teamId);
    if (!role || role === "VIEWER") throw new Error("FORBIDDEN");
    return db.category.create({
      data: { name: data.name, color: data.color, teamId: data.teamId },
    });
  }
  return db.category.create({
    data: { name: data.name, color: data.color, userId },
  });
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryInput,
  userId: string
): Promise<Category> {
  const category = await getCategoryById(id, userId);

  if (category.teamId) {
    const role = await getMemberRole(userId, category.teamId);
    if (!role || role === "VIEWER") throw new Error("FORBIDDEN");
  } else if (category.userId !== userId) {
    throw new Error("FORBIDDEN");
  }

  return db.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.color !== undefined && { color: data.color }),
    },
  });
}

export async function deleteCategory(id: string, userId: string): Promise<void> {
  const category = await getCategoryById(id, userId);

  if (category.teamId) {
    const role = await getMemberRole(userId, category.teamId);
    if (!role || role === "VIEWER") throw new Error("FORBIDDEN");
  } else if (category.userId !== userId) {
    throw new Error("FORBIDDEN");
  }

  await db.category.delete({ where: { id } });
}
