"use client";

import { useState } from "react";

export interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "completed" | "overdue";
  dueDate: string;
  description: string;
}

interface TaskListProps {
  initialTasks: Task[];
}

const STATUS_LABELS: Record<Task["status"], string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

const STATUS_COLORS: Record<Task["status"], string> = {
  todo: "bg-gray-100 text-gray-600",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

export default function TaskList({ initialTasks }: TaskListProps) {
  const [tasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<Task["status"] | "all">("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "title">("dueDate");

  const filtered = tasks
    .filter((t) => filter === "all" || t.status === filter)
    .sort((a, b) =>
      sortBy === "dueDate"
        ? a.dueDate.localeCompare(b.dueDate)
        : a.title.localeCompare(b.title)
    );

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        {(["all", "todo", "in-progress", "completed", "overdue"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          )
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="dueDate">Due Date</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      <ul className="divide-y">
        {filtered.length === 0 && (
          <li className="p-6 text-center text-sm text-gray-400">
            No tasks found.
          </li>
        )}
        {filtered.map((task) => (
          <li key={task.id} className="flex items-center gap-4 p-4">
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-gray-900">{task.title}</p>
              <p className="text-xs text-gray-400">Due: {task.dueDate}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                STATUS_COLORS[task.status]
              }`}
            >
              {STATUS_LABELS[task.status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
