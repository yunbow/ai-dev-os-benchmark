"use client";

import { useTransition } from "react";
import { toggleTaskStatus, deleteTask } from "./task.actions";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface TaskCardProps {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  onEdit: (id: string) => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
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

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

export default function TaskCard({
  id,
  title,
  status,
  priority,
  dueDate,
  onEdit,
}: TaskCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggleStatus() {
    startTransition(async () => {
      await toggleTaskStatus(id, NEXT_STATUS[status]);
    });
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this task?")) return;
    startTransition(async () => {
      await deleteTask(id);
    });
  }

  function handleEdit() {
    onEdit(id);
  }

  const formattedDueDate = dueDate
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(dueDate)
    : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <div className="flex shrink-0 gap-1">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[priority]}`}
          >
            {priority}
          </span>
        </div>
      </div>

      {formattedDueDate && (
        <p className="mt-1 text-xs text-gray-500">Due: {formattedDueDate}</p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleToggleStatus}
          disabled={isPending}
          className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
        >
          → {STATUS_LABELS[NEXT_STATUS[status]]}
        </button>
        <button
          onClick={handleEdit}
          disabled={isPending}
          className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="ml-auto rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {isPending && (
        <p className="mt-2 text-xs text-gray-400">Saving...</p>
      )}
    </div>
  );
}
