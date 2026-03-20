import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getTasks } from "@/lib/actions/tasks";
import { TaskList } from "@/components/tasks/task-list";
import { TaskListSkeleton } from "@/components/skeletons/task-skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tasks" };

async function TasksContent() {
  const result = await getTasks({ limit: 20 });

  if (!result.success) {
    return (
      <p className="text-destructive">Failed to load tasks: {result.error}</p>
    );
  }

  return (
    <TaskList
      initialTasks={result.data.tasks}
      initialNextCursor={result.data.nextCursor}
      initialHasMore={result.data.hasMore}
    />
  );
}

export default async function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">
          Manage and track all your tasks
        </p>
      </div>

      <Suspense fallback={<TaskListSkeleton />}>
        <TasksContent />
      </Suspense>
    </div>
  );
}
