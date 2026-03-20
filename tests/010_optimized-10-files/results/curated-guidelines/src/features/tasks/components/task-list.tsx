"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { TaskWithRelations } from "../types/task-types";
import { deleteTask } from "../server/task-actions";
import { TaskCard } from "./task-card";
import type { CursorPaginatedResult } from "@/lib/actions/action-helpers";

interface TaskListProps {
  initialData: CursorPaginatedResult<TaskWithRelations>;
  onLoadMore: (cursor: string) => Promise<CursorPaginatedResult<TaskWithRelations>>;
  onEditTask: (task: TaskWithRelations) => void;
}

export function TaskList({ initialData, onLoadMore, onEditTask }: TaskListProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialData.data);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    const result = await deleteTask({ id: taskId });
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast.success("Task deleted");
  }, []);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    const result = await onLoadMore(nextCursor);
    setTasks((prev) => [...prev, ...result.data]);
    setNextCursor(result.nextCursor);
    setHasMore(result.hasMore);
    setIsLoadingMore(false);
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No tasks yet</p>
        <p className="text-sm mt-1">Create your first task to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onTaskDelete={handleTaskDelete}
          onTaskEdit={onEditTask}
        />
      ))}

      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
