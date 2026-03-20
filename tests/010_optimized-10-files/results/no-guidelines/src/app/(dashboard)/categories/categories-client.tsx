"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { categorySchema, type CategoryInput } from "@/lib/validations";
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CategoryBadge } from "@/components/category-badge";
import { useToast } from "@/components/ui/use-toast";

interface Category {
  id: string;
  name: string;
  color: string;
  userId: string | null;
  teamId: string | null;
  createdAt: Date | string;
  _count: { tasks: number };
  team: { id: string; name: string } | null;
}

interface CategoriesClientProps {
  initialCategories: Category[];
}

const DEFAULT_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
];

function CategoryForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
}: {
  defaultValues?: { name: string; color: string };
  onSubmit: (data: CategoryInput) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      color: defaultValues?.color ?? "#3B82F6",
    },
  });

  const selectedColor = watch("color");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="cat-name">
          Name <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <Input
          id="cat-name"
          {...register("name")}
          placeholder="e.g., Work, Personal"
          maxLength={50}
          aria-describedby={errors.name ? "cat-name-error" : undefined}
          aria-invalid={!!errors.name}
          aria-required="true"
          disabled={isPending}
        />
        {errors.name && (
          <p id="cat-name-error" className="text-xs text-destructive" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-color">Color</Label>
        <div className="flex items-center gap-3">
          <Input
            id="cat-color"
            type="color"
            {...register("color")}
            className="h-10 w-16 p-1 cursor-pointer"
            aria-label="Choose category color"
            disabled={isPending}
          />
          <div
            className="h-8 w-8 rounded-full border"
            style={{ backgroundColor: selectedColor }}
            aria-hidden="true"
          />
          <span className="text-sm text-muted-foreground font-mono">
            {selectedColor}
          </span>
        </div>

        {/* Quick color swatches */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick color selection">
          {DEFAULT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue("color", color)}
              className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                backgroundColor: color,
                borderColor: selectedColor === color ? "black" : "transparent",
              }}
              aria-label={`Select color ${color}`}
              aria-pressed={selectedColor === color}
            />
          ))}
        </div>

        {errors.color && (
          <p className="text-xs text-destructive" role="alert">
            {errors.color.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(data: CategoryInput) {
    startTransition(async () => {
      const result = await createCategory(data);
      if (!result.success) {
        toast({
          title: "Failed to create category",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setCategories((prev) => [
        { ...result.data!, team: null },
        ...prev,
      ]);
      setShowCreateForm(false);
      toast({ title: "Category created" });
    });
  }

  function handleUpdate(data: CategoryInput) {
    if (!editingCategory) return;
    startTransition(async () => {
      const result = await updateCategory(editingCategory.id, data);
      if (!result.success) {
        toast({
          title: "Failed to update category",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? { ...c, name: result.data!.name, color: result.data!.color }
            : c
        )
      );
      setEditingCategory(null);
      toast({ title: "Category updated" });
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.success) {
        toast({
          title: "Failed to delete category",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Category deleted" });
    });
  }

  return (
    <div className="space-y-4">
      {/* Create category card */}
      {showCreateForm ? (
        <Card>
          <CardHeader>
            <CardTitle>New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm
              onSubmit={handleCreate}
              isPending={isPending}
              submitLabel="Create Category"
            />
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => setShowCreateForm(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          New Category
        </Button>
      )}

      {/* Category list */}
      {categories.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm">No categories yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <CategoryBadge
                          name={category.name}
                          color={category.color}
                        />
                        {category.team && (
                          <span className="text-xs text-muted-foreground">
                            ({category.team.name})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {category._count.tasks} task
                        {category._count.tasks !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCategory(category)}
                      aria-label={`Edit ${category.name} category`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                      disabled={isPending}
                      aria-label={`Delete ${category.name} category`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      >
        <DialogContent aria-labelledby="edit-category-title">
          <DialogHeader>
            <DialogTitle id="edit-category-title">Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              defaultValues={{
                name: editingCategory.name,
                color: editingCategory.color,
              }}
              onSubmit={handleUpdate}
              isPending={isPending}
              submitLabel="Save Changes"
            />
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditingCategory(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
