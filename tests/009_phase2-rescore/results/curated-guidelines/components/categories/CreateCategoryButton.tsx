"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createCategorySchema, CreateCategoryInput } from "@/features/categories/schema/category-schema";
import { createCategory } from "@/features/categories/server/category-actions";
import { useRouter } from "next/navigation";

export default function CreateCategoryButton() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: "", color: "#3B82F6" },
  });

  async function onSubmit(values: CreateCategoryInput) {
    setIsLoading(true);
    try {
      const result = await createCategory(values);
      if (result.success) {
        toast.success("Category created");
        setOpen(false);
        form.reset({ name: "", color: "#3B82F6" });
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        New Category
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-category-title"
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 id="create-category-title" className="text-lg font-bold mb-4">Create Category</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  id="cat-name"
                  {...form.register("name")}
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="cat-color" className="block text-sm font-medium text-gray-700 mb-1">
                  Color *
                </label>
                <div className="flex gap-2">
                  <input
                    id="cat-color"
                    type="color"
                    {...form.register("color")}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.watch("color")}
                    onChange={(e) => form.setValue("color", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="#FF5733"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
                {form.formState.errors.color && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {form.formState.errors.color.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); form.reset(); }}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
