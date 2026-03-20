import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { CategoriesView } from "@/features/categories/components/categories-view";

export const metadata = { title: "Categories - TaskFlow" };

export default async function CategoriesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId },
        { team: { members: { some: { userId } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
      <CategoriesView initialCategories={categories} />
    </div>
  );
}
