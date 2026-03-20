"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import type { TaskFilterInput } from "@/lib/validations/task";
import { TaskStatus, TaskPriority } from "@prisma/client";

interface TaskFiltersProps {
  categories: { id: string; name: string; color: string }[];
  currentFilters: Partial<TaskFilterInput>;
}

export function TaskFilters({ categories, currentFilters }: TaskFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("cursor"); // Reset pagination on filter change
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters =
    currentFilters.status ||
    currentFilters.priority ||
    currentFilters.categoryId ||
    currentFilters.search;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search tasks..."
            defaultValue={currentFilters.search ?? ""}
            className="pl-9"
            onChange={(e) => {
              const value = e.target.value;
              const timeout = setTimeout(() => updateFilter("search", value), 300);
              return () => clearTimeout(timeout);
            }}
            aria-label="Search tasks"
          />
        </div>

        <Select
          value={currentFilters.status ?? ""}
          onValueChange={(v) => updateFilter("status", v || null)}
        >
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
            <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.priority ?? ""}
          onValueChange={(v) => updateFilter("priority", v || null)}
        >
          <SelectTrigger className="w-36" aria-label="Filter by priority">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All priorities</SelectItem>
            <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
            <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
            <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
          </SelectContent>
        </Select>

        {categories.length > 0 && (
          <Select
            value={currentFilters.categoryId ?? ""}
            onValueChange={(v) => updateFilter("categoryId", v || null)}
          >
            <SelectTrigger className="w-40" aria-label="Filter by category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                      aria-hidden="true"
                    />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={`${currentFilters.sortBy ?? "createdAt"}-${currentFilters.sortOrder ?? "desc"}`}
          onValueChange={(v) => {
            const [sortBy, sortOrder] = v.split("-");
            const params = new URLSearchParams(searchParams.toString());
            params.set("sortBy", sortBy);
            params.set("sortOrder", sortOrder);
            params.delete("cursor");
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <SelectTrigger className="w-44" aria-label="Sort tasks">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest first</SelectItem>
            <SelectItem value="createdAt-asc">Oldest first</SelectItem>
            <SelectItem value="dueDate-asc">Due date (soonest)</SelectItem>
            <SelectItem value="dueDate-desc">Due date (latest)</SelectItem>
            <SelectItem value="priority-desc">Priority (high-low)</SelectItem>
            <SelectItem value="priority-asc">Priority (low-high)</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500"
          >
            <X className="h-4 w-4 mr-1" aria-hidden="true" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
