import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CategoriesList } from "@/components/categories/categories-list";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Categories - TaskFlow" };

export default async function CategoriesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const categories = await prisma.category.findMany({
    where: { userId, teamId: null },
    select: {
      id: true,
      name: true,
      color: true,
      _count: { select: { tasks: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <section aria-labelledby="categories-heading">
      <div className="mb-6">
        <h1 id="categories-heading" className="text-2xl font-bold">Categories</h1>
        <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
          Organize your tasks with color-coded categories.
        </p>
      </div>
      <CategoriesList initialCategories={categories} />
    </section>
  );
}
