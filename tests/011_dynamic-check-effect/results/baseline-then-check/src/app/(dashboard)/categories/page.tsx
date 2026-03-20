import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryForm } from "@/components/categories/category-form";
import { deleteCategory } from "@/actions/category";
import { sanitizeHexColor } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

async function CategoryList({ userId }: { userId: string }) {
  const categories = await db.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: true } } },
  });

  if (categories.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12 text-sm">
        No categories yet. Create one to organize your tasks!
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Your categories">
      {categories.map((cat) => {
        const safeColor = sanitizeHexColor(cat.color);
        return (
          <li key={cat.id}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <span
                  className="h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: safeColor }}
                  aria-hidden="true"
                />
                <CardTitle className="text-base">{cat.name}</CardTitle>
                <form
                  action={deleteCategory.bind(null, cat.id)}
                  className="ml-auto"
                >
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    aria-label={`Delete category ${cat.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </form>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {cat._count.tasks} task{cat._count.tasks !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{cat.color}</p>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

export default async function CategoriesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <CategoryForm />
          </DialogContent>
        </Dialog>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        }
      >
        <CategoryList userId={userId} />
      </Suspense>
    </div>
  );
}
