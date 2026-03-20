"use client";

import React, { useState, useCallback } from "react";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTasks } from "@/lib/actions/tasks";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creator: { id: string; name: string | null; email: string };
  assignee: { id: string; name: string | null; email: string } | null;
  category: { id: string; name: string; color: string } | null;
  team: { id: string; name: string } | null;
}

interface TaskListProps {
  initialTasks: Task[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  teamId?: string;
}

export function TaskList({
  initialTasks,
  initialNextCursor,
  initialHasMore,
  teamId,
}: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("createdAt");

  const fetchTasks = useCallback(
    async (cursor?: string, reset = false) => {
      setIsLoading(true);
      const result = await getTasks({
        ...(search && { search }),
        ...(statusFilter !== "all" && {
          status: statusFilter as "TODO" | "IN_PROGRESS" | "DONE",
        }),
        ...(priorityFilter !== "all" && {
          priority: priorityFilter as "LOW" | "MEDIUM" | "HIGH",
        }),
        sortBy: sortBy as "createdAt" | "dueDate" | "priority",
        sortOrder: "desc",
        ...(cursor && { cursor }),
        ...(teamId && { teamId }),
        limit: 20,
      });

      if (result.success) {
        if (reset) {
          setTasks(result.data.tasks as Task[]);
        } else {
          setTasks((prev) => [...prev, ...(result.data.tasks as Task[])]);
        }
        setNextCursor(result.data.nextCursor);
        setHasMore(result.data.hasMore);
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
      setIsLoading(false);
    },
    [search, statusFilter, priorityFilter, sortBy, teamId]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks(undefined, true);
  };

  const handleFilterChange = () => {
    fetchTasks(undefined, true);
  };

  const handleLoadMore = () => {
    if (nextCursor) fetchTasks(nextCursor);
  };

  const handleTaskDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={handleSearch}
          className="flex gap-2 flex-1"
          role="search"
          aria-label="Search tasks"
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search tasks"
            />
          </div>
          <Button type="submit" variant="outline" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setTimeout(handleFilterChange, 0);
            }}
          >
            <SelectTrigger className="w-[130px]" aria-label="Filter by status">
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(v) => {
              setPriorityFilter(v);
              setTimeout(handleFilterChange, 0);
            }}
          >
            <SelectTrigger className="w-[130px]" aria-label="Filter by priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v) => {
              setSortBy(v);
              setTimeout(handleFilterChange, 0);
            }}
          >
            <SelectTrigger className="w-[130px]" aria-label="Sort by">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created At</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>

          <Button asChild>
            <Link href={teamId ? `/dashboard/tasks/new?teamId=${teamId}` : "/dashboard/tasks/new"}>
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Task grid */}
      {tasks.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-sm mt-1">
            Create your first task to get started
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          aria-label="Task list"
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={handleTaskDelete} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
            aria-label="Load more tasks"
          >
            {isLoading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
