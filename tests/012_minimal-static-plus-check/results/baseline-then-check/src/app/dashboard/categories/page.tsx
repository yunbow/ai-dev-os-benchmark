import { Suspense, useState } from "react";
import { getCategories } from "@/lib/actions/categories";
import { deleteCategory } from "@/lib/actions/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";
import { CategoriesClient } from "./categories-client";

export const metadata: Metadata = { title: "Categories" };

async function CategoriesContent() {
  const result = await getCategories();
  const categories = result.success ? result.data : [];

  return <CategoriesClient initialCategories={categories} />;
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-muted-foreground">
          Organize your tasks with color-coded categories
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        }
      >
        <CategoriesContent />
      </Suspense>
    </div>
  );
}
