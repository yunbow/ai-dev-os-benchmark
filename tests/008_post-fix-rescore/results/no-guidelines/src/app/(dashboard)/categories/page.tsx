import React, { Suspense } from "react";
import { getCategories } from "@/actions/category-actions";
import { CategoriesClient } from "./categories-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Categories",
};

function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

async function CategoriesContent() {
  const result = await getCategories();

  if (!result.success) {
    throw new Error(result.error);
  }

  return <CategoriesClient initialCategories={result.data ?? []} />;
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Categories
        </h1>
        <p className="mt-1 text-muted-foreground">
          Organize your tasks with categories
        </p>
      </div>

      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContent />
      </Suspense>
    </div>
  );
}
