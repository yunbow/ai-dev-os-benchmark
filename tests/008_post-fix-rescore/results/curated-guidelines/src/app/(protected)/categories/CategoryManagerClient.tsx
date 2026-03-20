"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryBadge } from "@/features/category/components/CategoryBadge";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/features/category/server/category-actions";
import { toast } from "@/hooks/useToast";
import { Plus, Trash2, Edit2, Check, X, Tag } from "lucide-react";
import { type Category } from "@prisma/client";
import { sanitizeCategoryColor } from "@/features/category/schema/category-schema";

interface CategoryManagerClientProps {
  initialCategories: Category[];
}

export function CategoryManagerClient({
  initialCategories,
}: CategoryManagerClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366F1");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const result = await createCategory({ name: newName, color: newColor });

    if (result.success) {
      setCategories((prev) => [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewColor("#6366F1");
      setIsAdding(false);
      toast({ title: "Category created", variant: "default" });
    } else {
      toast({ title: result.error.message, variant: "destructive" });
    }

    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Tasks using it won't be deleted.")) return;

    const result = await deleteCategory(id);

    if (result.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Category deleted" });
    } else {
      toast({ title: result.error.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      {categories.length === 0 && !isAdding ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Tag className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">No categories yet</p>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4" />
            Create your first category
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
                <CategoryBadge name={cat.name} color={cat.color} />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(cat.id)}
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {!isAdding && (
            <Button
              variant="outline"
              onClick={() => setIsAdding(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              Add category
            </Button>
          )}
        </>
      )}

      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border bg-card p-4 space-y-3"
        >
          <h3 className="font-medium">New Category</h3>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Work, Personal"
                maxLength={50}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="cat-color"
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value.toUpperCase())}
                  className="h-10 w-10 rounded border cursor-pointer"
                />
                <Input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value.toUpperCase())}
                  placeholder="#6366F1"
                  className="w-28 font-mono text-sm"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {newName && sanitizeCategoryColor(newColor) && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Preview:</p>
              <CategoryBadge name={newName} color={newColor} />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setNewName("");
                setNewColor("#6366F1");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
