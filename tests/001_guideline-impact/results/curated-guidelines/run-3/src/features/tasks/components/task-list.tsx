"use client";

import { useState } from "react";
import { Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { CursorPagination } from "@/components/common/pagination";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";
import { useTaskActions } from "../hooks/useTaskActions";
import type { TaskWithRelations, PaginatedTasks } from "../types/task-types";
import type { Category } from "@prisma/client";

interface TaskListProps {
  initialData: PaginatedTasks;
  categories: Category[];
  onLoadMore?: (cursor: string) => Promise<PaginatedTasks>;
}

export function TaskList({ initialData, categories, onLoadMore }: TaskListProps) {
  const [allTasks, setAllTasks] = useState(initialData.tasks);
  const [hasNextPage, setHasNextPage] = useState(initialData.hasNextPage);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [total] = useState(initialData.total);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { tasks, handleToggleStatus, handleDeleteTask } = useTaskActions(allTasks);

  const handleLoadMore = async (cursor: string) => {
    if (!onLoadMore) return;
    setIsLoadingMore(true);
    try {
      const data = await onLoadMore(cursor);
      setAllTasks((prev) => [...prev, ...data.tasks]);
      setHasNextPage(data.hasNextPage);
      setNextCursor(data.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleTaskCreated = (task: TaskWithRelations) => {
    setAllTasks((prev) => [task, ...prev]);
    setIsCreating(false);
  };

  const handleTaskUpdated = (task: TaskWithRelations) => {
    setAllTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    setEditingTask(null);
  };

  if (tasks.length === 0) {
    return (
      <>
        <EmptyState
          icon={ClipboardList}
          title="No tasks yet"
          description="Get started by creating your first task."
          action={
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          }
        />
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <TaskForm
              categories={categories}
              onSuccess={handleTaskCreated}
              onCancel={() => setIsCreating(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {total} task{total !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteTask}
            onEdit={setEditingTask}
          />
        ))}
      </div>

      <CursorPagination
        hasNextPage={hasNextPage}
        nextCursor={nextCursor}
        onLoadMore={handleLoadMore}
        isLoading={isLoadingMore}
        total={total}
        currentCount={tasks.length}
      />

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            categories={categories}
            onSuccess={handleTaskCreated}
            onCancel={() => setIsCreating(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              task={editingTask}
              categories={categories}
              onSuccess={handleTaskUpdated}
              onCancel={() => setEditingTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
