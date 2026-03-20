"use client";

import { useState } from "react";
import type { Category } from "@prisma/client";
import type { TaskWithRelations } from "../types/task-types";
import type { CursorPaginatedResult } from "@/lib/actions/action-helpers";
import { TaskList } from "./task-list";
import { listTasks } from "../server/task-actions";
import type { ListTasksInput } from "../schema/task-schema";

interface TasksPageClientProps {
  initialTasks: CursorPaginatedResult<TaskWithRelations>;
  categories: Category[];
}

export function TasksPageClient({ initialTasks, categories }: TasksPageClientProps) {
  const [filters, setFilters] = useState<Partial<ListTasksInput>>({});
  const [search, setSearch] = useState("");
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleLoadMore = async (cursor: string) => {
    const result = await listTasks({ ...filters, search: search || undefined, cursor, sortBy: "createdAt", sortOrder: "desc" });
    if (!result.success) throw new Error(result.error.message);
    return result.data;
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
        >
          New Task
        </button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search tasks"
        />
      </div>

      <TaskList
        key={JSON.stringify(filters) + search}
        initialData={initialTasks}
        onLoadMore={handleLoadMore}
        onEditTask={setEditingTask}
      />
    </main>
  );
}
