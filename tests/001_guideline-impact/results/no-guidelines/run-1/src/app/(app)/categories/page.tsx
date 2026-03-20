"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { createCategory, deleteCategory } from "@/lib/actions/category";
import { toast } from "@/hooks/use-toast";
import { Tag, Pencil, Trash2 } from "lucide-react";
import useSWR from "swr";

interface Category {
  id: string;
  name: string;
  color: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export default function CategoriesPage() {
  return <CategoriesContent />;
}

function CategoriesContent() {
  const { data: categories = [], mutate } = useSWR<Category[]>(
    "/api/v1/categories",
    fetcher
  );
  const [isPending, startTransition] = useTransition();

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createCategory(formData);
      if (result.success) {
        toast({ title: "Category created" });
        mutate();
        (e.target as HTMLFormElement).reset();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  async function handleDelete(id: string) {
    const result = await deleteCategory(id);
    if (result.success) {
      toast({ title: "Category deleted" });
      mutate();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Categories</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" maxLength={50} required placeholder="Category name" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    defaultValue="#3B82F6"
                    className="h-9 w-16 cursor-pointer p-1"
                    aria-label="Pick a color"
                  />
                  <span className="text-sm text-gray-500">Pick a color for the category badge</span>
                </div>
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700">Your Categories</h2>
          {categories.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No categories yet"
              description="Create your first category to organize tasks."
            />
          ) : (
            <ul className="space-y-2" role="list">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: cat.color }}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-gray-900">{cat.name}</span>
                    <Badge style={{ backgroundColor: cat.color, color: "#fff", borderColor: cat.color }}>
                      {cat.name}
                    </Badge>
                  </div>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Delete ${cat.name}`}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    }
                    title="Delete category"
                    description={`Are you sure you want to delete "${cat.name}"? Tasks using this category will not be deleted.`}
                    confirmLabel="Delete"
                    onConfirm={() => handleDelete(cat.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
