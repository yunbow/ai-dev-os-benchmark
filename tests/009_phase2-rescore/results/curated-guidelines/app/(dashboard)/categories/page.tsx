import { Suspense } from "react";
import { getCategories } from "@/features/categories/server/category-actions";
import CategoryList from "@/components/categories/CategoryList";
import CreateCategoryButton from "@/components/categories/CreateCategoryButton";

async function CategoriesSection() {
  const result = await getCategories();
  if (!result.success) {
    return <p className="text-red-600">Failed to load categories</p>;
  }
  return <CategoryList initialData={result.data} />;
}

export default function CategoriesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <CreateCategoryButton />
      </div>
      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      }>
        <CategoriesSection />
      </Suspense>
    </div>
  );
}
