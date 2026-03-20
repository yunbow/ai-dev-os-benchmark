import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TaskList } from "@/features/tasks/components/TaskList";
import { TaskListSkeleton } from "@/features/tasks/components/TaskListSkeleton";
import { TaskFilters } from "@/features/tasks/components/TaskFilters";

interface TasksPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    categoryId?: string;
    search?: string;
    cursor?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;

  return (
    <section aria-labelledby="tasks-heading">
      <div className="mb-6 flex items-center justify-between">
        <h1 id="tasks-heading" className="text-2xl font-bold">Tasks</h1>
        <Link href="/tasks/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          New Task
        </Link>
      </div>

      <TaskFilters />

      <Suspense fallback={<TaskListSkeleton />}>
        <TaskList searchParams={params} />
      </Suspense>
    </section>
  );
}
