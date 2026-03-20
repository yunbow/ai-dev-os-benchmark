"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TaskCard } from "./TaskCard";
import { TaskFilters } from "./TaskFilters";
import { Button } from "@/components/ui/button";
import type { TaskWithRelations } from "@/types";
import type { TaskFilterInput } from "@/lib/validations/task";

interface TaskListProps {
  initialTasks: TaskWithRelations[];
  nextCursor: string | null;
  hasMore: boolean;
  categories: { id: string; name: string; color: string }[];
  currentFilters: Partial<TaskFilterInput>;
  currentUserId: string;
}

export function TaskList({
  initialTasks,
  nextCursor,
  hasMore,
  categories,
  currentFilters,
  currentUserId,
}: TaskListProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStatusChange = (updatedTask: TaskWithRelations) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const loadMore = () => {
    if (!nextCursor) return;
    const params = new URLSearchParams(window.location.search);
    params.set("cursor", nextCursor);
    router.push(`/tasks?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <TaskFilters categories={categories} currentFilters={currentFilters} />

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <div className="text-5xl mb-4" aria-hidden="true">📋</div>
          <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
          <p className="text-gray-500 mt-1">
            {Object.keys(currentFilters).some(
              (k) => k !== "sortBy" && k !== "sortOrder" && k !== "limit"
            )
              ? "Try adjusting your filters"
              : "Create your first task to get started"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3" role="list" aria-label="Task list">
            {tasks.map((task) => (
              <div key={task.id} role="listitem">
                <TaskCard
                  task={task}
                  canEdit={task.creatorId === currentUserId}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMore}>
                Load more tasks
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
