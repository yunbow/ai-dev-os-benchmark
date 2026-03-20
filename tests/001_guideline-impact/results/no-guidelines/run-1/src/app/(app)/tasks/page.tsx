import { auth } from "@/lib/auth";
import { Suspense } from "react";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskListSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckSquare } from "lucide-react";
import * as taskService from "@/lib/services/task.service";
import { TaskFilterSchema } from "@/lib/validations/task";

interface TasksPageProps {
  searchParams: Promise<Record<string, string>>;
}

async function TaskList({ searchParams }: { searchParams: Record<string, string> }) {
  const session = await auth();
  const userId = session!.user!.id!;

  const parsed = TaskFilterSchema.safeParse(searchParams);
  const filters = parsed.success ? parsed.data : { sortBy: "createdAt" as const, sortOrder: "desc" as const };

  const { data: tasks, nextCursor, hasMore } = await taskService.getTasks(userId, filters);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks found"
        description="Create your first task to get started."
        actionLabel="Create task"
        actionHref="/tasks/new"
      />
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" asChild>
            <Link href={`/tasks?cursor=${nextCursor}`}>Load more</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <Button asChild>
          <Link href="/tasks/new">New Task</Link>
        </Button>
      </div>

      <TaskFilters />

      <Suspense fallback={<TaskListSkeleton />} key={JSON.stringify(params)}>
        <TaskList searchParams={params} />
      </Suspense>
    </div>
  );
}
