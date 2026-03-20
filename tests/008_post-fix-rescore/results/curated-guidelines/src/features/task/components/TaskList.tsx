"use client";

import { useTaskList } from "@/hooks/useTaskList";
import { TaskCard } from "@/features/task/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList } from "lucide-react";
import type { TaskFiltersInput } from "@/features/task/schema/task-schema";
import type { TaskWithRelations } from "@/features/task/services/task-service";

interface TaskListProps {
  filters: Omit<TaskFiltersInput, "cursor">;
}

export function TaskList({ filters }: TaskListProps) {
  const {
    tasks,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    fetchMore,
    optimisticUpdate,
  } = useTaskList(filters);

  function handleTaskUpdate(updated: TaskWithRelations) {
    optimisticUpdate(updated.id, () => updated);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">No tasks found</p>
        <p className="text-sm text-muted-foreground/70">
          Create a new task or adjust your filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onUpdate={handleTaskUpdate} />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={fetchMore}
            disabled={isFetchingMore}
          >
            {isFetchingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
