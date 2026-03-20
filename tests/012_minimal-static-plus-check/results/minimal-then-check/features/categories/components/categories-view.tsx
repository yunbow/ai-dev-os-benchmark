"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Category } from "@prisma/client";
import { categorySchema, type CategoryInput } from "@/features/categories/schema";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/features/categories/server/actions";

export function CategoriesView({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { color: "#6366F1" },
  });

  function handleCategoryEditStart(category: Category) {
    setEditingId(category.id);
    reset({ name: category.name, color: category.color });
    setIsFormVisible(true);
  }

  async function onSubmit(data: CategoryInput) {
    if (editingId) {
      const result = await updateCategoryAction(editingId, data);
      if (result.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, ...data } : c))
        );
        toast.success("Category updated");
        setIsFormVisible(false);
        setEditingId(null);
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await createCategoryAction(data);
      if (result.success) {
        setCategories((prev) => [result.data, ...prev]);
        toast.success("Category created");
        setIsFormVisible(false);
        reset({ color: "#6366F1" });
      } else {
        toast.error(result.error);
      }
    }
  }

  function handleCategoryDelete(categoryId: string) {
    startTransition(async () => {
      const result = await deleteCategoryAction(categoryId);
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        toast.success("Category deleted");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => {
          setEditingId(null);
          reset({ color: "#6366F1" });
          setIsFormVisible(!isFormVisible);
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {isFormVisible ? "Cancel" : "New Category"}
      </button>

      {isFormVisible && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
          aria-label={editingId ? "Edit category form" : "Create category form"}
        >
          <h3 className="font-medium text-gray-900">
            {editingId ? "Edit Category" : "New Category"}
          </h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="cat-name"
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("name")}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "cat-name-error" : undefined}
              />
              {errors.name && (
                <p id="cat-name-error" className="mt-1 text-xs text-red-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="cat-color" className="block text-sm font-medium text-gray-700">
                Color
              </label>
              <input
                id="cat-color"
                type="color"
                className="mt-1 h-10 w-16 rounded-md border border-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("color")}
                aria-invalid={!!errors.color}
                aria-describedby={errors.color ? "cat-color-error" : undefined}
              />
              {errors.color && (
                <p id="cat-color-error" className="mt-1 text-xs text-red-600" role="alert">
                  {errors.color.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500" role="status">
          No categories yet. Create one to organize your tasks.
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Categories">
          {categories.map((category) => (
            <li
              key={category.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-6 w-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                />
                <span className="font-medium text-gray-900">{category.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCategoryEditStart(category)}
                  className="text-gray-400 hover:text-blue-600 focus:outline-none focus:text-blue-600 text-xs"
                  aria-label={`Edit ${category.name}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleCategoryDelete(category.id)}
                  disabled={isPending}
                  className="text-gray-400 hover:text-red-600 focus:outline-none focus:text-red-600 text-xs"
                  aria-label={`Delete ${category.name}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
