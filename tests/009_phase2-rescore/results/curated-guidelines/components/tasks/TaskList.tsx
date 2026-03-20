"use client";

import { useState } from "react";
import { Task } from "@prisma/client";
import { toggleTaskStatus, deleteTask } from "@/features/tasks/server/task-actions";
import { toast } from "sonner";

interface TaskWithRelations extends Task {
  category?: { id: string; name: string; color: string } | null;
  assignee?: { id: string; name: string | null; email: string } | null;
}

interface TaskListProps {
  initialData: {
    items: TaskWithRelations[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

const statusLabels = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityColors = {
  LOW: "text-green-600 bg-green-100",
  MEDIUM: "text-yellow-600 bg-yellow-100",
  HIGH: "text-red-600 bg-red-100",
};

export default function TaskList({ initialData }: TaskListProps) {
  const [tasks, setTasks] = useState(initialData.items);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, string>>({});

  async function handleStatusToggle(taskId: string, currentStatus: string) {
    const nextStatus = currentStatus === "TODO"
      ? "IN_PROGRESS"
      : currentStatus === "IN_PROGRESS"
      ? "DONE"
      : "TODO";

    // Optimistic update
    setOptimisticStatuses((prev) => ({ ...prev, [taskId]: nextStatus }));

    const result = await toggleTaskStatus(taskId, nextStatus as "TODO" | "IN_PROGRESS" | "DONE");
    if (result.success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus as "TODO" | "IN_PROGRESS" | "DONE" } : t))
      );
    } else {
      // Revert optimistic update
      setOptimisticStatuses((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      toast.error(result.error.message);
    }
  }

  async function handleDelete(taskId: string) {
    const result = await deleteTask(taskId);
    if (result.success) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted");
    } else {
      toast.error(result.error.message);
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No tasks yet. Create your first task!
      </div>
    );
  }

  return (
    <div className="space-y-3" role="list" aria-label="Task list">
      {tasks.map((task) => {
        const displayStatus = optimisticStatuses[task.id] || task.status;
        return (
          <article
            key={task.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            role="listitem"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  onClick={() => handleStatusToggle(task.id, displayStatus)}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    displayStatus === "DONE"
                      ? "bg-green-500 border-green-500"
                      : displayStatus === "IN_PROGRESS"
                      ? "bg-blue-500 border-blue-500"
                      : "border-gray-300"
                  }`}
                  aria-label={`Toggle task status: ${task.title}`}
                  aria-pressed={displayStatus === "DONE"}
                />
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-gray-900 truncate ${displayStatus === "DONE" ? "line-through text-gray-400" : ""}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-500">
                      {statusLabels[displayStatus as keyof typeof statusLabels]}
                    </span>
                    {task.category && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: task.category.color }}
                      >
                        {task.category.name}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(task.id)}
                className="text-gray-400 hover:text-red-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                aria-label={`Delete task: ${task.title}`}
              >
                Delete
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
