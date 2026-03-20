"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryBadge } from "@/components/categories/category-badge";
import { deleteCategory } from "@/lib/actions/categories";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Category } from "@prisma/client";

interface CategoriesClientProps {
  initialCategories: Category[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast({ title: "Category deleted" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleCreateSuccess = () => {
    setCreateOpen(false);
    // Refresh by navigating
    window.location.reload();
  };

  const handleUpdateSuccess = () => {
    setEditingId(null);
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
        </p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
            <CategoryForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground border rounded-lg"
          role="status"
        >
          <p className="text-lg font-medium">No categories yet</p>
          <p className="text-sm mt-1">
            Create categories to organize your tasks
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          aria-label="Category list"
        >
          {categories.map((category) => (
            <Card key={category.id} className="group">
              <CardContent className="pt-4 flex items-center justify-between">
                <CategoryBadge category={category} />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog
                    open={editingId === category.id}
                    onOpenChange={(open) => setEditingId(open ? category.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={`Edit category ${category.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                      </DialogHeader>
                      <CategoryForm
                        category={category}
                        onSuccess={handleUpdateSuccess}
                        onCancel={() => setEditingId(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(category.id)}
                    disabled={isPending}
                    aria-label={`Delete category ${category.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
