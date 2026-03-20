"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Tag, Edit, Trash2, X } from "lucide-react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../actions";
import type { Category } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CategoryCreateSchema } from "../schemas";
import type { CategoryCreateInput } from "../schemas";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#64748b", "#78716c",
];

export default function CategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listCategories();
      if (result.success) setCategories(result.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Tasks in this category will not be deleted.")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    const result = await deleteCategory(id);
    if (!result.success) loadCategories();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Category
        </button>
      </div>

      {loading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          role="status"
          aria-label="Loading categories"
          aria-busy="true"
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" aria-hidden="true" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="h-10 w-10 text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-500">No categories yet. Create your first category!</p>
        </div>
      ) : (
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          role="list"
          aria-label="Categories"
        >
          {categories.map((category) => (
            <li key={category.id}>
              <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                <span
                  className="h-8 w-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color ?? "#6b7280" }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                  <p className="text-xs text-gray-400">{category.color}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setShowForm(true);
                    }}
                    className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Edit ${category.name}`}
                  >
                    <Edit className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Delete ${category.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <CategoryForm
          category={editingCategory ?? undefined}
          onSuccess={() => {
            setShowForm(false);
            setEditingCategory(null);
            loadCategories();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

interface CategoryFormProps {
  category?: Category;
  onSuccess: () => void;
  onCancel: () => void;
}

function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryCreateInput>({
    resolver: zodResolver(CategoryCreateSchema),
    defaultValues: {
      name: category?.name ?? "",
      color: category?.color ?? "#3b82f6",
    },
  });

  const currentColor = watch("color");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const onSubmit = async (data: CategoryCreateInput) => {
    let result;
    if (isEditing) {
      result = await updateCategory(category.id, { name: data.name, color: data.color });
    } else {
      result = await createCategory(data);
    }

    if (result.success) {
      onSuccess();
    } else {
      setError("root", { message: result.error.message });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onCancel} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Edit category" : "Create category"}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-sm bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">
              {isEditing ? "Edit Category" : "New Category"}
            </h2>
            <button
              onClick={onCancel}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="px-5 py-4 space-y-4">
              {errors.root && (
                <div
                  role="alert"
                  className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
                >
                  {errors.root.message}
                </div>
              )}

              <div>
                <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  {...register("name")}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  autoFocus
                />
                {errors.name && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="cat-color" className="block text-sm font-medium text-gray-700 mb-1">
                  Color <span aria-hidden="true" className="text-red-500">*</span>
                </label>

                {/* Preset swatches */}
                <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Preset colors">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("color", c, { shouldValidate: true })}
                      className="h-6 w-6 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: currentColor === c ? "#1d4ed8" : "transparent",
                      }}
                      aria-label={`Select color ${c}`}
                      aria-pressed={currentColor === c}
                    />
                  ))}
                </div>

                {/* Hex input */}
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-full border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: currentColor }}
                    aria-hidden="true"
                  />
                  <input
                    id="cat-color"
                    type="text"
                    {...register("color")}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#3b82f6"
                    aria-invalid={!!errors.color}
                  />
                </div>
                {errors.color && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.color.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
