"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Task, Category, User, TaskStatus } from "@prisma/client";
import { toggleTaskStatusAction, deleteTaskAction } from "@/features/tasks/server/actions";
import { TaskCard } from "./task-card";
import { TaskFilters } from "./task-filters";

const CreateTaskModal = dynamic(
  () => import("./create-task-modal").then((m) => m.CreateTaskModal),
  { ssr: false }
);

export type TaskWithRelations = Task & {
  category: Pick<Category, "id" | "name" | "color"> | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  creator: Pick<User, "id" | "name" | "email">;
};

export function TaskList({
  initialTasks,
  initialCursor,
  initialHasMore,
  userId,
}: {
  initialTasks: TaskWithRelations[];
  initialCursor: string | null;
  initialHasMore: boolean;
  userId: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleTaskStatusToggle(taskId: string, newStatus: TaskStatus, updatedAt: Date) {
    // Optimistic update
    const previousTasks = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    startTransition(async () => {
      const result = await toggleTaskStatusAction(taskId, newStatus, updatedAt);
      if (!result.success) {
        // Rollback on failure
        setTasks(previousTasks);
        toast.error(result.error);
      }
    });
  }

  function handleTaskDelete(taskId: string) {
    startTransition(async () => {
      const result = await deleteTaskAction(taskId);
      if (result.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        toast.success("Task deleted");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleTaskCreate(task: TaskWithRelations) {
    setTasks((prev) => [task, ...prev]);
    setIsCreateModalOpen(false);
    toast.success("Task created");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <TaskFilters />
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          New Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500" role="status">
          <p className="text-lg">No tasks yet</p>
          <p className="text-sm mt-1">Create a task to get started</p>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Task list">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard
                task={task}
                currentUserId={userId}
                onStatusToggle={handleTaskStatusToggle}
                onDelete={handleTaskDelete}
              />
            </li>
          ))}
        </ul>
      )}

      {isCreateModalOpen && (
        <CreateTaskModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleTaskCreate}
        />
      )}
    </div>
  );
}
