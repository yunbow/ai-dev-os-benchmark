"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "../server/category-actions";
import { createCategorySchema, CreateCategoryInput } from "../schema/category-schema";
import { Category } from "@prisma/client";

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
];

function CategoryForm({
  defaultValues,
  onSubmit,
  isPending,
}: {
  defaultValues?: Partial<CreateCategoryInput>;
  onSubmit: (values: CreateCategoryInput) => void;
  isPending: boolean;
}) {
  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: "", color: "#3B82F6", ...defaultValues },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cat-name">Name *</Label>
        <Input
          id="cat-name"
          disabled={isPending}
          {...form.register("name")}
          aria-describedby={form.formState.errors.name ? "cat-name-error" : undefined}
        />
        {form.formState.errors.name && (
          <p id="cat-name-error" className="text-sm text-destructive" role="alert">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Color *</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => form.setValue("color", color)}
              className="h-8 w-8 rounded-full ring-offset-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
              aria-pressed={form.watch("color") === color}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            className="h-9 w-16 cursor-pointer p-1"
            {...form.register("color")}
            aria-label="Custom color"
          />
          <Input
            className="flex-1 font-mono"
            {...form.register("color")}
            placeholder="#RRGGBB"
            aria-label="Hex color code"
          />
        </div>
        {form.formState.errors.color && (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.color.message}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(values: CreateCategoryInput) {
    startTransition(async () => {
      const result = await createCategoryAction(values);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      setCategories((prev) => [...prev, result.data]);
      setCreateOpen(false);
      toast.success("Category created");
    });
  }

  function handleUpdate(id: string, values: CreateCategoryInput) {
    startTransition(async () => {
      const result = await updateCategoryAction(id, values);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      setCategories((prev) => prev.map((c) => (c.id === id ? result.data : c)));
      setEditingId(null);
      toast.success("Category updated");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            New Category
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Category</DialogTitle>
            </DialogHeader>
            <CategoryForm onSubmit={handleCreate} isPending={isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-lg font-medium">No categories yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create categories to organize your tasks</p>
        </div>
      ) : (
        <ul className="space-y-2" aria-label="Category list">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-3 rounded-lg border bg-card p-4">
              <span
                className="h-5 w-5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
                aria-hidden
              />
              <span className="flex-1 font-medium">{category.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{category.color}</span>

              <Dialog open={editingId === category.id} onOpenChange={(o) => setEditingId(o ? category.id : null)}>
                <DialogTrigger
                  render={<Button variant="ghost" size="icon" aria-label={`Edit ${category.name}`} />}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                  </DialogHeader>
                  <CategoryForm
                    defaultValues={{ name: category.name, color: category.color }}
                    onSubmit={(values) => handleUpdate(category.id, values)}
                    isPending={isPending}
                  />
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(category.id)}
                disabled={isPending}
                aria-label={`Delete ${category.name}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
