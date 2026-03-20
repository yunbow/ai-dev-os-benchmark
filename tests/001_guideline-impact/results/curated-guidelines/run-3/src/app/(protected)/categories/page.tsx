import type { Metadata } from "next";
import { getCategories } from "@/features/categories/server/category-actions";
import { CategoryList } from "@/features/categories/components/category-list";

export const metadata: Metadata = {
  title: "Categories",
};

export default async function CategoriesPage() {
  const result = await getCategories();
  const categories = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="mt-1 text-gray-500">
          Organize your tasks with custom categories.
        </p>
      </div>

      {!result.success && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Failed to load categories: {result.error.message}
        </div>
      )}

      <CategoryList initialCategories={categories} />
    </div>
  );
}
