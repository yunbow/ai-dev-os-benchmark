"use client";

import { useState } from "react";
import { Category } from "@prisma/client";
import { deleteCategory } from "@/features/categories/server/category-actions";
import { toast } from "sonner";

interface CategoryListProps {
  initialData: Category[];
}

export default function CategoryList({ initialData }: CategoryListProps) {
  const [categories, setCategories] = useState(initialData);

  async function handleDelete(categoryId: string) {
    const result = await deleteCategory(categoryId);
    if (result.success) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      toast.success("Category deleted");
    } else {
      toast.error(result.error.message);
    }
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No categories yet. Create your first category!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {categories.map((category) => (
        <div
          key={category.id}
          className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color }}
              aria-hidden="true"
            />
            <span className="font-medium text-gray-900">{category.name}</span>
          </div>
          <button
            onClick={() => handleDelete(category.id)}
            className="text-gray-400 hover:text-red-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            aria-label={`Delete category: ${category.name}`}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
