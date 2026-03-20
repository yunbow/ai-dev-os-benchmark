"use client";

import { useState } from "react";
import type { Task } from "@prisma/client";
import { deleteTask } from "@/lib/actions/tasks";

interface TaskListProps {
  tasks: Task[];
}

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

export function TaskList({ tasks }: TaskListProps) {
  const [items, setItems] = useState(tasks);

  async function handleDelete(taskId: string) {
    if (!confirm("Delete this task?")) return;
    const result = await deleteTask(taskId);
    if (result.success) {
      setItems((prev) => prev.filter((t) => t.id !== taskId));
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center text-sm text-gray-500 shadow">
        No tasks yet. Create your first task!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between rounded-lg bg-white p-4 shadow"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{task.title}</span>
              <span
                className={`rounded px-2 py-0.5 text-xs ${priorityColors[task.priority] ?? ""}`}
              >
                {task.priority}
              </span>
            </div>
            {task.description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                {task.description}
              </p>
            )}
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
              <span>{statusLabels[task.status] ?? task.status}</span>
              {task.dueDate && (
                <span>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => handleDelete(task.id)}
            className="ml-4 text-sm text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
