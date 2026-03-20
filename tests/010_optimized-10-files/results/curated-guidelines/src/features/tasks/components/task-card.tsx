"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { TaskWithRelations } from "../types/task-types";
import { updateTaskStatus } from "../server/task-actions";
import { TaskStatus, Priority } from "@prisma/client";

interface TaskCardProps {
  task: TaskWithRelations;
  onTaskDelete: (taskId: string) => void;
  onTaskEdit: (task: TaskWithRelations) => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  TODO: TaskStatus.IN_PROGRESS,
  IN_PROGRESS: TaskStatus.DONE,
  DONE: TaskStatus.TODO,
};

export function TaskCard({ task, onTaskDelete, onTaskEdit }: TaskCardProps) {
  const [currentStatus, setCurrentStatus] = useState(task.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState(task.updatedAt);

  const handleStatusToggle = async () => {
    const newStatus = STATUS_NEXT[currentStatus];

    // Optimistic update
    setCurrentStatus(newStatus);
    setIsUpdating(true);

    const result = await updateTaskStatus({
      id: task.id,
      status: newStatus,
      updatedAt: new Date(currentUpdatedAt).toISOString(),
    });

    setIsUpdating(false);

    if (!result.success) {
      // Revert optimistic update on failure
      setCurrentStatus(task.status);
      toast.error(result.error.message);
      return;
    }

    setCurrentUpdatedAt(result.data.updatedAt);
    toast.success(`Task marked as ${STATUS_LABELS[newStatus]}`);
  };

  return (
    <article className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={handleStatusToggle}
            disabled={isUpdating}
            aria-label={`Mark task as ${STATUS_LABELS[STATUS_NEXT[currentStatus]]}`}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
              currentStatus === TaskStatus.DONE
                ? "bg-green-500 border-green-500"
                : currentStatus === TaskStatus.IN_PROGRESS
                ? "bg-blue-500 border-blue-500"
                : "border-gray-300 hover:border-blue-400"
            } disabled:opacity-50`}
          />
          <div className="min-w-0">
            <h3
              className={`text-sm font-medium text-gray-900 truncate ${
                currentStatus === TaskStatus.DONE ? "line-through text-gray-400" : ""
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onTaskEdit(task)}
            aria-label="Edit task"
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            onClick={() => onTaskDelete(task.id)}
            aria-label="Delete task"
            className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            PRIORITY_COLORS[task.priority]
          }`}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>

        {task.category && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${task.category.color}20`,
              color: task.category.color,
            }}
          >
            {task.category.name}
          </span>
        )}

        {task.dueDate && (
          <span
            className={`text-xs ${
              new Date(task.dueDate) < new Date() && currentStatus !== TaskStatus.DONE
                ? "text-red-600"
                : "text-gray-400"
            }`}
          >
            Due {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}

        {task.assignee && (
          <span className="text-xs text-gray-400">
            → {task.assignee.name ?? task.assignee.email}
          </span>
        )}
      </div>
    </article>
  );
}
