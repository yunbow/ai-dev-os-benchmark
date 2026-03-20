"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function TaskFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`/tasks?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="search" aria-label="Task filters">
      <input
        type="search"
        placeholder="Search tasks..."
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => updateFilter("search", e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Search tasks"
      />
      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Filter by status"
      >
        <option value="">All Status</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="DONE">Done</option>
      </select>
      <select
        value={searchParams.get("priority") ?? ""}
        onChange={(e) => updateFilter("priority", e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Filter by priority"
      >
        <option value="">All Priority</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>
      <select
        value={searchParams.get("sortBy") ?? "createdAt"}
        onChange={(e) => updateFilter("sortBy", e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Sort by"
      >
        <option value="createdAt">Date Created</option>
        <option value="dueDate">Due Date</option>
        <option value="priority">Priority</option>
      </select>
    </div>
  );
}
