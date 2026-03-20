"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskCard } from "@/components/task-card";
import type { TaskStatus, TaskPriority } from "@prisma/client";

interface Category {
  id: string;
  name: string;
  color: string;
}

// Dates come serialized as strings from Next.js server component boundary
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | string | null;
  updatedAt: Date | string;
  category: { id: string; name: string; color: string } | null;
  assignee: { id: string; name: string | null; email: string; image: string | null } | null;
  creator: { id: string; name: string | null; email: string; image: string | null };
}

interface TasksClientProps {
  initialTasks: Task[];
  categories: Category[];
  nextCursor: string | null;
  hasMore: boolean;
  filters: {
    status?: string;
    priority?: string;
    categoryId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export function TasksClient({
  initialTasks,
  categories,
  nextCursor: initialNextCursor,
  hasMore: initialHasMore,
  filters,
}: TasksClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update tasks when server data changes
  useEffect(() => {
    setTasks(initialTasks);
    setNextCursor(initialNextCursor);
    setHasMore(initialHasMore);
  }, [initialTasks, initialNextCursor, initialHasMore]);

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("cursor"); // Reset pagination when filtering
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      updateFilter("search", value || null);
    }, 300);
  }

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cursor", nextCursor);

      const res = await fetch(`/api/v1/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load more tasks");

      const data = await res.json();
      setTasks((prev) => [...prev, ...data.data]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Failed to load more tasks:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleTaskDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleStatusChange(id: string, status: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  }

  function handleSortToggle() {
    const currentOrder = filters.sortOrder ?? "desc";
    updateFilter("sortOrder", currentOrder === "desc" ? "asc" : "desc");
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div
        className="flex flex-wrap gap-3 items-center"
        role="search"
        aria-label="Filter tasks"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            aria-label="Search tasks"
          />
        </div>

        {/* Status filter */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={(val) => updateFilter("status", val)}
        >
          <SelectTrigger className="w-36" aria-label="Filter by status">
            <SlidersHorizontal className="h-4 w-4 mr-2" aria-hidden="true" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority filter */}
        <Select
          value={filters.priority ?? "all"}
          onValueChange={(val) => updateFilter("priority", val)}
        >
          <SelectTrigger className="w-36" aria-label="Filter by priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Category filter */}
        {categories.length > 0 && (
          <Select
            value={filters.categoryId ?? "all"}
            onValueChange={(val) => updateFilter("categoryId", val)}
          >
            <SelectTrigger className="w-40" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort by */}
        <Select
          value={filters.sortBy ?? "createdAt"}
          onValueChange={(val) => updateFilter("sortBy", val)}
        >
          <SelectTrigger className="w-36" aria-label="Sort by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Date Created</SelectItem>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort order toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleSortToggle}
          aria-label={`Sort ${filters.sortOrder === "asc" ? "ascending" : "descending"}, click to toggle`}
        >
          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Task list */}
      <section aria-label="Task list">
        {tasks.length === 0 ? (
          <div
            className="text-center py-16 text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm">
              {filters.search || filters.status || filters.priority
                ? "No tasks match your filters."
                : "No tasks yet. Create your first task!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3" aria-label={`${tasks.length} tasks`}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={handleTaskDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={isLoadingMore}
              aria-label="Load more tasks"
            >
              {isLoadingMore ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
