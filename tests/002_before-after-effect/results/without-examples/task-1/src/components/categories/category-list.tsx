"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "./category-badge";
import { deleteCategory } from "@/lib/actions/categories";
import { useToast } from "@/components/ui/use-toast";
import type { CategoryWithCount } from "@/lib/types";

interface CategoryListProps {
  categories: CategoryWithCount[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Tasks in this category will not be deleted.")) return;

    setDeletingId(id);
    try {
      const result = await deleteCategory(id);
      if (result.success) {
        toast({ title: "Category deleted" });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error.message,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-white">
        <p className="text-gray-500">No categories yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Create a category to organize your tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-white"
        >
          <div className="flex items-center gap-3">
            <CategoryBadge name={category.name} color={category.color} size="md" />
            <span className="text-sm text-gray-500">
              {category._count.tasks} task{category._count.tasks !== 1 ? "s" : ""}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDelete(category.id)}
            disabled={deletingId === category.id}
          >
            {deletingId === category.id ? "Deleting..." : "Delete"}
          </Button>
        </div>
      ))}
    </div>
  );
}
