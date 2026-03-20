import type { Metadata } from "next";
import { Suspense } from "react";
import { getTasks } from "@/features/tasks/server/task-actions";
import { getCategories } from "@/features/categories/server/category-actions";
import { TaskList } from "@/features/tasks/components/task-list";
import { TaskFilters } from "@/features/tasks/components/task-filters";
import { TaskSearch } from "@/features/tasks/components/task-search";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskFiltersInput } from "@/features/tasks/schema/task-schema";
import type { TaskStatus, TaskPriority } from "@prisma/client";

export const metadata: Metadata = {
  title: "Tasks",
};

interface TasksPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    categoryId?: string;
    search?: string;
    cursor?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

async function TasksContent({ searchParams }: { searchParams: Awaited<TasksPageProps["searchParams"]> }) {
  const filters: TaskFiltersInput = {
    status: searchParams.status as TaskStatus | undefined,
    priority: searchParams.priority as TaskPriority | undefined,
    categoryId: searchParams.categoryId,
    search: searchParams.search,
    cursor: searchParams.cursor,
    sortBy: searchParams.sortBy as TaskFiltersInput["sortBy"],
    sortOrder: searchParams.sortOrder as "asc" | "desc" | undefined,
    limit: 20,
  };

  const [tasksResult, categoriesResult] = await Promise.all([
    getTasks(filters),
    getCategories(),
  ]);

  if (!tasksResult.success) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        Failed to load tasks: {tasksResult.error.message}
      </div>
    );
  }

  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <TaskList
      initialData={tasksResult.data}
      categories={categories}
    />
  );
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="mt-1 text-gray-500">Manage and track your tasks.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TaskSearch />
        <Suspense>
          <TaskFilters />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        }
      >
        <TasksContent searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  );
}
