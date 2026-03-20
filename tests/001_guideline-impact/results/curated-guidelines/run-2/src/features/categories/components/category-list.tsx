"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@prisma/client";
import { deleteCategory } from "../server/category-actions";
import { sanitizeCategoryColor } from "../types/category-types";
import { CategoryForm } from "./category-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Tag, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const router = useRouter();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleDelete = async (id: string) => {
    const result = await deleteCategory(id);
    if (!result.success) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Category deleted" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categories</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <CategoryForm onSuccess={() => router.refresh()} />
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Create a category to organize your tasks"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full"
                    style={{ backgroundColor: sanitizeCategoryColor(category.color) }}
                  />
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                      </DialogHeader>
                      <CategoryForm
                        category={editingCategory ?? undefined}
                        onSuccess={() => {
                          setEditingCategory(null);
                          router.refresh();
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
