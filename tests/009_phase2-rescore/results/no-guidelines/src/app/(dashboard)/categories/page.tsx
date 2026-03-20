import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CategoryList } from "@/components/categories/category-list";
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const categories = await db.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Categories</h1>
        <CreateCategoryDialog />
      </div>
      <CategoryList categories={categories} />
    </div>
  );
}
