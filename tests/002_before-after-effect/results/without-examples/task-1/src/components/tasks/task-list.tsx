"use client";

import { useState, useTransition } from "react";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { getTasks } from "@/lib/actions/tasks";
import type { TaskWithRelations, PaginationResult } from "@/lib/types";

interface TaskListProps {
  initialData: PaginationResult<TaskWithRelations>;
  currentParams: Record<string, string>;
}

export function TaskList({ initialData, currentParams }: TaskListProps) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  const loadMore = () => {
    if (!data.nextCursor) return;

    startTransition(async () => {
      const result = await getTasks({
        ...currentParams,
        cursor: data.nextCursor!,
      });

      if (result.success) {
        setData((prev) => ({
          data: [...prev.data, ...result.data.data],
          nextCursor: result.data.nextCursor,
          hasMore: result.data.hasMore,
        }));
      }
    });
  };

  if (data.data.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-white">
        <p className="text-gray-500">No tasks found.</p>
        <p className="text-sm text-gray-400 mt-1">
          Create a new task or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Showing {data.data.length} task{data.data.length !== 1 ? "s" : ""}
      </p>

      <div className="space-y-3">
        {data.data.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {data.hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isPending}
          >
            {isPending ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
