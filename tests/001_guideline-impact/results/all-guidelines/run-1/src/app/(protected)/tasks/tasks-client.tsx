"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskList } from "@/features/tasks/components/task-list";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import type { TaskStatus, TaskPriority, Category } from "@prisma/client";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  category: { id: string; name: string; color: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  creator: { id: string; name: string | null; email: string };
  createdAt: Date;
  updatedAt: Date;
};

interface TasksClientProps {
  initialTasks: TaskItem[];
  categories: Category[];
}

export function TasksClient({ initialTasks, categories }: TasksClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const filteredTasks = initialTasks.filter((task) => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (
        !task.title.toLowerCase().includes(searchLower) &&
        !task.description?.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (categoryFilter !== "all" && task.category?.id !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tasks"
            />
          </div>
        </div>
        <CreateTaskDialog onSuccess={handleRefresh} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Task filters">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <Filter className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
          </SelectContent>
        </Select>

        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
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

        {(statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
              setCategoryFilter("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      <TaskList
        tasks={filteredTasks}
        onRefresh={handleRefresh}
      />

      {filteredTasks.length === 0 && initialTasks.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No tasks match your filters
        </p>
      )}
    </div>
  );
}
