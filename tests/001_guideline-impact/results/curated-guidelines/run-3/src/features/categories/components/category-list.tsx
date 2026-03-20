"use client";

import { useState } from "react";
import { Plus, Tag, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { CategoryForm } from "./category-form";
import { deleteCategory } from "../server/category-actions";
import { toast } from "@/hooks/use-toast";
import type { Category } from "@prisma/client";

interface CategoryListProps {
  initialCategories: Category[];
}

export function CategoryList({ initialCategories }: CategoryListProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleCategoryCreated = (cat: Category) => {
    setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
    setIsCreating(false);
    toast({ title: "Category created" });
  };

  const handleCategoryUpdated = (cat: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? cat : c)).sort((a, b) => a.name.localeCompare(b.name))
    );
    setEditingCategory(null);
    toast({ title: "Category updated" });
  };

  const handleDelete = async (id: string) => {
    const result = await deleteCategory(id);
    if (!result.success) {
      toast({ title: "Failed to delete", description: result.error.message, variant: "destructive" });
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Category deleted" });
  };

  if (categories.length === 0 && !isCreating) {
    return (
      <>
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Organize your tasks with custom categories."
          action={
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Button>
          }
        />
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <CategoryForm
              onSuccess={handleCategoryCreated}
              onCancel={() => setIsCreating(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
        </p>
        <Button size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-8 w-8 rounded-full shrink-0"
                style={{
                  backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(cat.color)
                    ? cat.color
                    : "#6b7280",
                }}
              />
              <span className="font-medium text-gray-900">{cat.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditingCategory(cat)}
                aria-label={`Edit ${cat.name}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDelete(cat.id)}
                aria-label={`Delete ${cat.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSuccess={handleCategoryCreated}
            onCancel={() => setIsCreating(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSuccess={handleCategoryUpdated}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
