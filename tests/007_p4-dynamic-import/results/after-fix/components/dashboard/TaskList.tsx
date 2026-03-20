"use client";

import { useState } from "react";

type FilterStatus = "all" | "completed" | "overdue" | "pending";
type SortKey = "title" | "dueDate" | "status";

interface Task {
  id: string;
  title: string;
  status: "completed" | "overdue" | "pending";
  dueDate: string;
}

interface TaskListProps {
  initialTasks: Task[];
}

export function TaskList({ initialTasks }: TaskListProps) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");

  const filtered = initialTasks
    .filter((t) => filter === "all" || t.status === filter)
    .sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      if (sortKey === "status") return a.status.localeCompare(b.status);
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          className="border rounded px-2 py-1 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterStatus)}
        >
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
          <option value="pending">Pending</option>
        </select>

        <select
          className="border rounded px-2 py-1 text-sm"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="dueDate">Due Date</option>
          <option value="title">Title</option>
          <option value="status">Status</option>
        </select>
      </div>

      <ul className="divide-y border rounded-lg">
        {filtered.map((task) => (
          <li key={task.id} className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">{task.title}</span>
            <span className="text-sm text-muted-foreground">
              {task.status} · {task.dueDate}
            </span>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-muted-foreground text-sm">
            No tasks found.
          </li>
        )}
      </ul>
    </div>
  );
}
