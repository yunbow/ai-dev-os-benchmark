import React, { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getTasks } from "@/actions/task-actions";
import { getCategories } from "@/actions/category-actions";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskListSkeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

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
    teamId?: string;
  }>;
}

async function TasksContent({ searchParams }: TasksPageProps) {
  const session = await auth();
  const resolvedParams = await searchParams;

  const [tasksResult, categoriesResult] = await Promise.all([
    getTasks(resolvedParams),
    getCategories(resolvedParams.teamId),
  ]);

  if (!tasksResult.success) {
    throw new Error(tasksResult.error);
  }

  const categories = categoriesResult.success ? categoriesResult.data ?? [] : [];

  return (
    <TaskList
      tasks={tasksResult.data!.tasks}
      categories={categories}
      nextCursor={tasksResult.data!.nextCursor}
      hasMore={tasksResult.data!.hasMore}
      total={tasksResult.data!.total}
      currentUserId={session!.user!.id!}
      teamId={resolvedParams.teamId}
    />
  );
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const resolvedParams = await searchParams;
  const categoriesResult = await getCategories(resolvedParams.teamId);
  const categories = categoriesResult.success ? categoriesResult.data ?? [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tasks</h1>
        <p className="mt-1 text-muted-foreground">
          Manage and track your tasks
        </p>
      </div>

      <TaskFilters categories={categories} />

      <Suspense fallback={<TaskListSkeleton />}>
        <TasksContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
