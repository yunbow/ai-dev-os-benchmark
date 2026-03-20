import { getCategories } from "@/lib/actions/categories";
import { CategoryList } from "@/components/categories/category-list";
import { CategoryForm } from "@/components/categories/category-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Categories - TaskFlow",
};

export default async function CategoriesPage() {
  const categoriesResult = await getCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Categories</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {categoriesResult.success ? (
            <CategoryList categories={categoriesResult.data} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              Failed to load categories.
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create Category</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
