"use client";

import { useTransition, useState } from "react";
import { toggleTaskStatus, deleteTask } from "@/actions/task.actions";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
}

interface TaskCardProps {
  task: Task;
  onTaskDelete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

function getNextStatus(current: TaskStatus): TaskStatus {
  const cycle: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
  return cycle[(cycle.indexOf(current) + 1) % cycle.length];
}

export function TaskCard({ task, onTaskDelete, onTaskEdit }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleStatusToggle() {
    const nextStatus = getNextStatus(task.status);
    startTransition(async () => {
      await toggleTaskStatus(task.id, nextStatus);
    });
  }

  function handleTaskDeleteConfirm() {
    startTransition(async () => {
      await deleteTask(task.id);
      onTaskDelete(task.id);
      setShowDeleteConfirm(false);
    });
  }

  function handleDeleteDialogOpen() {
    setShowDeleteConfirm(true);
  }

  function handleDeleteDialogClose() {
    setShowDeleteConfirm(false);
  }

  function handleTaskEdit() {
    onTaskEdit(task);
  }

  const formattedDueDate = task.dueDate
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(task.dueDate)
    : null;

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug">
            {task.title}
          </h3>
          <div className="flex shrink-0 gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status]}`}
            >
              {STATUS_LABELS[task.status]}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
        </div>

        {formattedDueDate && (
          <p className="mb-3 text-xs text-gray-500">Due: {formattedDueDate}</p>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleStatusToggle}
            disabled={isPending}
            className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Updating…" : `→ ${STATUS_LABELS[getNextStatus(task.status)]}`}
          </button>
          <button
            onClick={handleTaskEdit}
            disabled={isPending}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteDialogOpen}
            disabled={isPending}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h4 className="mb-2 text-base font-semibold text-gray-900">
              Delete task?
            </h4>
            <p className="mb-5 text-sm text-gray-600">
              &ldquo;{task.title}&rdquo; will be permanently removed. This
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteDialogClose}
                disabled={isPending}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTaskDeleteConfirm}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
