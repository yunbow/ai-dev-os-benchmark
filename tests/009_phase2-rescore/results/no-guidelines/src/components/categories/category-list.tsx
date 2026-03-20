"use client";

import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteCategoryAction } from "@/actions/categories";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
  _count: { tasks: number };
}

export function CategoryList({ categories }: { categories: Category[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.success) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Category deleted" });
      }
    });
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">No categories yet</p>
        <p className="text-sm mt-1">Create a category to organize your tasks</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => (
        <Card key={cat.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat._count.tasks} tasks</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(cat.id)}
              disabled={isPending}
              aria-label={`Delete category ${cat.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
