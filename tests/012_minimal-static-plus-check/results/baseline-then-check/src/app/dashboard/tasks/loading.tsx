import { TaskListSkeleton } from "@/components/skeletons/task-skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
      </div>
      <TaskListSkeleton />
    </div>
  );
}
