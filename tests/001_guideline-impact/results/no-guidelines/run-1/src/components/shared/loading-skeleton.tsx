import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export function TaskListSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading tasks...">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard...">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-6">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-8 w-1/4" />
          </div>
        ))}
      </div>
      <TaskListSkeleton />
    </div>
  );
}

export { Skeleton };
