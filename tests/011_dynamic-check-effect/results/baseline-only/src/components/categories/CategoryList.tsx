"use client";

import { useState } from "react";
import { CategoryBadge } from "./CategoryBadge";
import { CategoryForm } from "./CategoryForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { deleteCategoryAction } from "@/actions/category";
import type { CategoryWithCount } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface CategoryListProps {
  initialCategories: CategoryWithCount[];
}

export function CategoryList({ initialCategories }: CategoryListProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);

  const handleCreate = (newCategory: CategoryWithCount) => {
    setCategories((prev) => [newCategory, ...prev]);
    setIsCreateOpen(false);
  };

  const handleUpdate = (updatedCategory: CategoryWithCount) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
    );
    setEditingCategory(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Tasks with this category will not be deleted.")) return;
    const result = await deleteCategoryAction(id);
    if (result.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Category deleted" });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <CategoryForm onSuccess={handleCreate} onCancel={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4" aria-hidden="true">🏷️</div>
            <h3 className="text-lg font-medium text-gray-900">No categories yet</h3>
            <p className="text-gray-500 mt-1">Create categories to organize your tasks</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
          {categories.map((category) => (
            <Card key={category.id} role="listitem">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <CategoryBadge name={category.name} color={category.color} />
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingCategory(category)}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(category.id)}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  {category._count.tasks} task{category._count.tasks !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSuccess={handleUpdate}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
