import { listCategoriesAction } from "@/features/categories/server/category-actions";
import { CategoryManager } from "@/features/categories/components/CategoryManager";

export default async function CategoriesPage() {
  const result = await listCategoriesAction();
  const categories = result.success ? result.data : [];

  return (
    <section aria-labelledby="categories-heading">
      <h1 id="categories-heading" className="mb-6 text-2xl font-bold">Categories</h1>
      <CategoryManager initialCategories={categories} />
    </section>
  );
}
