"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories";
import { hexColorRegex } from "@/validations/category";

interface Category {
  id: string;
  name: string;
  color: string;
  _count: { tasks: number };
}

interface CategoriesListProps {
  initialCategories: Category[];
}

export function CategoriesList({ initialCategories }: CategoriesListProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const color = formData.get("color") as string;

    if (!hexColorRegex.test(color)) {
      setErrors({ color: "Must be a valid hex color (e.g. #FF5733)" });
      return;
    }

    setErrors({});
    startTransition(async () => {
      const result = await createCategory(formData);
      if (!result.success) {
        const errs: Record<string, string> = {};
        if (result.details) {
          Object.entries(result.details).forEach(([k, v]) => { errs[k] = v[0] ?? ""; });
        } else {
          errs.root = result.error;
        }
        setErrors(errs);
      } else {
        setCategories((prev) => [
          ...prev,
          { ...result.data, _count: { tasks: 0 } },
        ]);
        toast.success("Category created");
        setCreateOpen(false);
      }
    });
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;
    const formData = new FormData(e.currentTarget);
    const color = formData.get("color") as string;

    if (!hexColorRegex.test(color)) {
      setErrors({ color: "Must be a valid hex color (e.g. #FF5733)" });
      return;
    }

    setErrors({});
    startTransition(async () => {
      const result = await updateCategory(editTarget.id, formData);
      if (!result.success) {
        toast.error(result.error);
      } else {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editTarget.id
              ? { ...c, name: result.data.name, color: result.data.color }
              : c
          )
        );
        toast.success("Category updated");
        setEditTarget(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this category? Tasks will be unassigned.")) return;
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.success) {
        toast.error(result.error);
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success("Category deleted");
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
              <DialogDescription>Add a color-coded category for your tasks.</DialogDescription>
            </DialogHeader>
            <form id="create-category-form" onSubmit={handleCreate} className="space-y-4" noValidate>
              {errors.root && <p role="alert" className="text-sm text-[var(--color-destructive)]">{errors.root}</p>}
              <div className="space-y-2">
                <Label htmlFor="cat-name">Name</Label>
                <Input id="cat-name" name="name" maxLength={50} required aria-invalid={!!errors.name} />
                {errors.name && <p role="alert" className="text-xs text-[var(--color-destructive)]">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-color">Color</Label>
                <div className="flex gap-2 items-center">
                  <Input id="cat-color" name="color" type="color" defaultValue="#3B82F6" className="h-10 w-14 cursor-pointer p-1" aria-invalid={!!errors.color} />
                  <span className="text-sm text-[var(--color-muted-foreground)]">Pick a color</span>
                </div>
                {errors.color && <p role="alert" className="text-xs text-[var(--color-destructive)]">{errors.color}</p>}
              </div>
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" form="create-category-form" disabled={isPending}>
                {isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted-foreground)]">
          <p className="text-lg font-medium">No categories yet</p>
          <p className="text-sm mt-1">Create your first category to organize tasks.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="group flex items-center justify-between rounded-lg border bg-[var(--color-card)] p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {cat._count.tasks} task{cat._count.tasks !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditTarget(cat); setErrors({}); }} aria-label={`Edit ${cat.name}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-destructive)]" onClick={() => handleDelete(cat.id)} disabled={isPending} aria-label={`Delete ${cat.name}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <form id="edit-category-form" onSubmit={handleEdit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="edit-cat-name">Name</Label>
                <Input id="edit-cat-name" name="name" defaultValue={editTarget.name} maxLength={50} required aria-invalid={!!errors.name} />
                {errors.name && <p role="alert" className="text-xs text-[var(--color-destructive)]">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cat-color">Color</Label>
                <Input id="edit-cat-color" name="color" type="color" defaultValue={editTarget.color} className="h-10 w-14 cursor-pointer p-1" aria-invalid={!!errors.color} />
                {errors.color && <p role="alert" className="text-xs text-[var(--color-destructive)]">{errors.color}</p>}
              </div>
            </form>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit" form="edit-category-form" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
