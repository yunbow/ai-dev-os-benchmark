import { Suspense } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFiltersBar } from "@/components/tasks/task-filters-bar";
import { CreateTaskButton } from "@/components/tasks/create-task-button";
import TasksLoading from "./loading";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tasks - TaskFlow" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  const userId = session!.user!.id!;

  const params = await searchParams;

  // Prefetch categories for filter bar
  const categories = await prisma.category.findMany({
    where: { userId, teamId: null },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return (
    <section aria-labelledby="tasks-heading">
      <div className="mb-6 flex items-center justify-between">
        <h1 id="tasks-heading" className="text-2xl font-bold">Tasks</h1>
        <CreateTaskButton categories={categories} />
      </div>

      <TaskFiltersBar categories={categories} currentParams={params} />

      <Suspense fallback={<TasksLoading />}>
        <TaskList userId={userId} searchParams={params} />
      </Suspense>
    </section>
  );
}
