"use client";

import React, { useState, useTransition } from "react";
import { deleteCategory } from "@/actions/category-actions";
import { CategoryForm } from "@/components/categories/category-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { Plus, Edit, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { sanitizeHexColor } from "@/lib/utils";
import type { Category } from "@prisma/client";

interface CategoriesClientProps {
  initialCategories: Category[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingCategoryId) return;
    setIsDeleting(true);
    try {
      const result = await deleteCategory(deletingCategoryId);
      if (result.success) {
        toast({
          variant: "success",
          title: "Category deleted",
          description: "Category has been deleted successfully.",
        });
        setDeletingCategoryId(null);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {initialCategories.length}{" "}
          {initialCategories.length === 1 ? "category" : "categories"}
        </p>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          size="sm"
          aria-label="Create new category"
        >
          <Plus className="mr-2 h-4 w-4" />
          New category
        </Button>
      </div>

      {/* Categories grid */}
      {initialCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No categories yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create categories to organize your tasks.
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="mt-4"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create category
          </Button>
        </div>
      ) : (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Categories"
        >
          {initialCategories.map((cat) => {
            const safeColor = sanitizeHexColor(cat.color);
            return (
              <li key={cat.id}>
                <Card className="overflow-hidden">
                  <div
                    className="h-2"
                    style={{ backgroundColor: safeColor }}
                    aria-hidden="true"
                  />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingCategory(cat)}
                          aria-label={`Edit category ${cat.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingCategoryId(cat.id)}
                          aria-label={`Delete category ${cat.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full border"
                        style={{ backgroundColor: safeColor }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-mono text-muted-foreground">
                        {safeColor}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* Create dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your tasks.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            onSuccess={() => setCreateDialogOpen(false)}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>
              Make changes to your category.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSuccess={() => setEditingCategory(null)}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingCategoryId}
        onOpenChange={(open) => !open && setDeletingCategoryId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete category
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? Tasks in this
              category will not be deleted, but will be unassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCategoryId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-busy={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
