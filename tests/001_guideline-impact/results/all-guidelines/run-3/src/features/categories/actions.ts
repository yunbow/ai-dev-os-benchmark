"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withAction, actionSuccess, ActionErrors, actionError } from "@/lib/action-helpers";
import { requireTeamRole } from "@/lib/permissions";
import { CategoryCreateSchema, CategoryUpdateSchema } from "./schemas";
import type { CategoryCreateInput, CategoryUpdateInput } from "./schemas";
import type { ActionResult } from "@/lib/action-helpers";
import type { Category } from "@prisma/client";

export async function createCategory(
  input: CategoryCreateInput
): Promise<ActionResult<Category>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const validated = CategoryCreateSchema.parse(input);

    // If creating a team category, verify membership
    if (validated.teamId) {
      const membership = await requireTeamRole(validated.teamId, session.user.id, "MEMBER");
      if (!("member" in membership)) return membership;
    }

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        color: validated.color,
        userId: session.user.id,
        teamId: validated.teamId ?? null,
      },
    });

    return actionSuccess(category);
  });
}

export async function updateCategory(
  categoryId: string,
  input: CategoryUpdateInput
): Promise<ActionResult<Category>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const validated = CategoryUpdateSchema.parse(input);

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) return ActionErrors.notFound("Category");

    // IDOR prevention
    if (category.userId !== session.user.id) return ActionErrors.forbidden();

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(validated.name ? { name: validated.name } : {}),
        ...(validated.color ? { color: validated.color } : {}),
      },
    });

    return actionSuccess(updated);
  });
}

export async function deleteCategory(categoryId: string): Promise<ActionResult<void>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { tasks: true } } },
    });

    if (!category) return ActionErrors.notFound("Category");

    // IDOR prevention
    if (category.userId !== session.user.id) return ActionErrors.forbidden();

    await prisma.category.delete({ where: { id: categoryId } });

    return actionSuccess(undefined);
  });
}

export async function listCategories(
  teamId?: string | null
): Promise<ActionResult<Category[]>> {
  return withAction(async () => {
    const session = await auth();
    if (!session?.user?.id) return ActionErrors.unauthorized();

    if (teamId) {
      // Verify team membership for team categories
      const membership = await requireTeamRole(teamId, session.user.id, "VIEWER");
      if (!("member" in membership)) return membership;
    }

    const categories = await prisma.category.findMany({
      where: teamId
        ? { teamId }
        : { userId: session.user.id, teamId: null },
      orderBy: { name: "asc" },
      take: 200,
    });

    return actionSuccess(categories);
  });
}
