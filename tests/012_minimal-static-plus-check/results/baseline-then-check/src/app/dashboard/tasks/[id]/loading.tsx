import { TaskDetailSkeleton } from "@/components/skeletons/task-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function TaskDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="h-4 w-32 mb-6" />
      <div className="space-y-6">
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <TaskDetailSkeleton />
        </div>
      </div>
    </div>
  );
}
