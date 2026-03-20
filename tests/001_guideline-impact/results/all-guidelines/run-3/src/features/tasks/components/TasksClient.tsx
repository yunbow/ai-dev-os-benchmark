"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Plus, Search, Filter, X } from "lucide-react";
import { getTasks, createTask, deleteTask, toggleTaskStatus } from "../actions";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";
import type { Category, TaskStatus, TaskPriority } from "@prisma/client";
import type { TaskWithRelations } from "../queries";

interface TasksClientProps {
  initialCategories: Category[];
}

const STATUS_OPTIONS: { value: TaskStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const PRIORITY_OPTIONS: { value: TaskPriority | ""; label: string }[] = [
  { value: "", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Created date" },
  { value: "dueDate", label: "Due date" },
  { value: "priority", label: "Priority" },
];

export default function TasksClient({ initialCategories }: TasksClientProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "dueDate" | "priority">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadTasks = useCallback(
    async (cursor?: string) => {
      setLoading(true);
      try {
        const result = await getTasks({
          search: search || undefined,
          status: (statusFilter as TaskStatus) || undefined,
          priority: (priorityFilter as TaskPriority) || undefined,
          categoryId: categoryFilter || undefined,
          sortBy,
          sortOrder,
          cursor,
          limit: 20,
        });

        if (result.success) {
          if (cursor) {
            setTasks((prev) => [...prev, ...result.data.data]);
          } else {
            setTasks(result.data.data);
          }
          setNextCursor(result.data.nextCursor);
          setHasMore(result.data.hasMore);
        }
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder]
  );

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadTasks();
    }, search ? 300 : 0);
    return () => clearTimeout(debounce);
  }, [loadTasks]);

  const handleToggleStatus = async (taskId: string, expectedUpdatedAt?: Date) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const nextStatus: Record<TaskStatus, TaskStatus> = {
          TODO: "IN_PROGRESS",
          IN_PROGRESS: "DONE",
          DONE: "TODO",
        };
        return { ...task, status: nextStatus[task.status] };
      })
    );

    const result = await toggleTaskStatus({
      taskId,
      expectedUpdatedAt,
    });

    if (result.success) {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? result.data : task)));
    } else {
      // Revert on failure
      loadTasks();
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const result = await deleteTask(taskId);

    if (!result.success) {
      loadTasks();
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTask(null);
    loadTasks();
  };

  const hasActiveFilters = !!search || !!statusFilter || !!priorityFilter || !!categoryFilter;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Search tasks"
          />
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" aria-hidden="true" />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "")}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "")}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Filter by priority"
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {initialCategories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {initialCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split(":");
            setSortBy(by as "createdAt" | "dueDate" | "priority");
            setSortOrder(order as "asc" | "desc");
          }}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Sort by"
        >
          {SORT_OPTIONS.flatMap((o) => [
            <option key={`${o.value}:desc`} value={`${o.value}:desc`}>
              {o.label} ↓
            </option>,
            <option key={`${o.value}:asc`} value={`${o.value}:asc`}>
              {o.label} ↑
            </option>,
          ])}
        </select>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setPriorityFilter("");
              setCategoryFilter("");
            }}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-md hover:bg-gray-100"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      {/* Task list */}
      {loading && tasks.length === 0 ? (
        <div
          className="grid grid-cols-1 gap-3"
          role="status"
          aria-label="Loading tasks"
          aria-busy="true"
        >
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" aria-hidden="true" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {hasActiveFilters ? "No tasks match your filters." : "No tasks yet. Create your first task!"}
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3" role="list" aria-label="Tasks">
            {tasks.map((task) => (
              <li key={task.id}>
                <TaskCard
                  task={task}
                  onToggleStatus={handleToggleStatus}
                  onEdit={() => {
                    setEditingTask(task);
                    setShowForm(true);
                  }}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={() => loadTasks(nextCursor ?? undefined)}
                disabled={loading}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Task form modal */}
      {showForm && (
        <TaskForm
          task={editingTask ?? undefined}
          categories={initialCategories}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
