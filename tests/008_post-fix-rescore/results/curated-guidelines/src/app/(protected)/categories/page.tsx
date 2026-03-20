import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { prisma } from "@/lib/prisma";
import { CategoryManagerClient } from "./CategoryManagerClient";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col overflow-hidden">
      <Header title="Categories" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Your Categories</h2>
              <p className="text-sm text-muted-foreground">
                Organize your personal tasks with categories
              </p>
            </div>
          </div>

          <CategoryManagerClient initialCategories={categories} />
        </div>
      </div>
    </div>
  );
}
