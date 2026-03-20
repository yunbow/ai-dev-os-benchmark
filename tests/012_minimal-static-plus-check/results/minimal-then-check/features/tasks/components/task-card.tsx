"use client";

import { Task, Category, User, TaskStatus, TaskPriority } from "@prisma/client";
import { useState } from "react";

type TaskWithRelations = Task & {
  category: Pick<Category, "id" | "name" | "color"> | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  creator: Pick<User, "id" | "name" | "email">;
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: "text-green-600 bg-green-50",
  MEDIUM: "text-yellow-600 bg-yellow-50",
  HIGH: "text-red-600 bg-red-50",
};

const statusTransitions: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

export function TaskCard({
  task,
  currentUserId,
  onStatusToggle,
  onDelete,
}: {
  task: TaskWithRelations;
  currentUserId: string;
  onStatusToggle: (id: string, status: TaskStatus, updatedAt: Date) => void;
  onDelete: (id: string) => void;
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const canModify = task.creatorId === currentUserId;
  const nextStatus = statusTransitions[task.status];

  return (
    <article className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onStatusToggle(task.id, nextStatus, task.updatedAt)}
          className={`mt-0.5 h-5 w-5 rounded-full border-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            task.status === "DONE"
              ? "bg-green-500 border-green-500"
              : "border-gray-300 hover:border-blue-400"
          }`}
          aria-label={`Mark as ${statusLabels[nextStatus]}`}
          aria-pressed={task.status === "DONE"}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-medium text-gray-900 ${
                task.status === "DONE" ? "line-through text-gray-500" : ""
              }`}
            >
              {task.title}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}
              >
                {task.priority}
              </span>
              {task.category && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: task.category.color }}
                  aria-label={`Category: ${task.category.name}`}
                >
                  {task.category.name}
                </span>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{statusLabels[task.status]}</span>
            {task.dueDate && (
              <span
                className={
                  new Date(task.dueDate) < new Date() && task.status !== "DONE"
                    ? "text-red-500 font-medium"
                    : ""
                }
              >
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.assignee && (
              <span>Assigned to: {task.assignee.name ?? task.assignee.email}</span>
            )}
          </div>
        </div>

        {canModify && (
          <div className="flex-shrink-0">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-xs text-red-600 hover:text-red-800 focus:outline-none focus:underline"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 focus:outline-none focus:underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="text-gray-400 hover:text-red-600 focus:outline-none focus:text-red-600"
                aria-label={`Delete task: ${task.title}`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
