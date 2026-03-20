import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryList } from "@/components/categories/CategoryList";

export const metadata: Metadata = {
  title: "Categories",
};

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;

  const categories = await prisma.category.findMany({
    where: { OR: [{ userId }, { team: { members: { some: { userId } } } }] },
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-600 mt-1">Organize your tasks with color-coded categories</p>
      </div>

      <CategoryList initialCategories={categories} />
    </div>
  );
}
