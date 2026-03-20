"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Edit, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createCategory,
  deleteCategory,
} from "@/features/categories/server/category-actions";
import {
  createCategorySchema,
  type CreateCategoryInput,
} from "@/features/categories/schema/category-schema";

type CategoryWithCount = {
  id: string;
  name: string;
  color: string;
  _count: { tasks: number };
};

interface CategoriesClientProps {
  initialCategories: CategoryWithCount[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: "", color: "#3B82F6" },
  });

  const onSubmit = async (data: CreateCategoryInput) => {
    setServerError(null);
    const result = await createCategory(data);

    if (!result.success) {
      if (result.error.fieldErrors) {
        for (const [field, messages] of Object.entries(result.error.fieldErrors)) {
          form.setError(field as keyof CreateCategoryInput, {
            type: "server",
            message: messages.join(", "),
          });
        }
      } else {
        setServerError(result.error.message);
      }
      return;
    }

    form.reset({ name: "", color: "#3B82F6" });
    setOpen(false);
    router.refresh();
  };

  const handleDelete = async (categoryId: string, taskCount: number) => {
    if (taskCount > 0) {
      if (!confirm(`This category has ${taskCount} task(s). Are you sure you want to delete it?`)) return;
    } else {
      if (!confirm("Are you sure you want to delete this category?")) return;
    }
    await deleteCategory(categoryId);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {serverError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="cat-name">Name *</Label>
                <Input
                  id="cat-name"
                  placeholder="Category name"
                  {...form.register("name")}
                  aria-invalid={!!form.formState.errors.name}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive" role="alert">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-color">Color *</Label>
                <div className="flex gap-2">
                  <input
                    id="cat-color"
                    type="color"
                    className="h-9 w-14 cursor-pointer rounded-md border border-input bg-transparent p-1"
                    {...form.register("color")}
                    aria-label="Choose category color"
                  />
                  <Input
                    placeholder="#FF5733"
                    {...form.register("color")}
                    aria-label="Hex color code"
                    maxLength={7}
                  />
                </div>
                {form.formState.errors.color && (
                  <p className="text-xs text-destructive" role="alert">
                    {form.formState.errors.color.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {initialCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Tag className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold">No categories yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create categories to organize your tasks
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Categories">
          {initialCategories.map((category) => (
            <li key={category.id}>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-4 w-4 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category._count.tasks} task
                        {category._count.tasks !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => handleDelete(category.id, category._count.tasks)}
                    aria-label={`Delete category: ${category.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
