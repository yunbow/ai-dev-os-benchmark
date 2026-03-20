import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { CategoryList } from "@/features/categories/components/category-list";

export const metadata = {
  title: "Categories - TaskFlow",
};

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>
      <CategoryList categories={categories} />
    </div>
  );
}
