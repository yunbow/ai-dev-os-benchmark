"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@prisma/client";

interface TaskFiltersProps {
  categories: Pick<Category, "id" | "name" | "color">[];
}

export function TaskFilters({ categories }: TaskFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "";
  const currentPriority = searchParams.get("priority") || "";
  const currentCategory = searchParams.get("categoryId") || "";
  const currentSort = searchParams.get("sortBy") || "createdAt";
  const currentOrder = searchParams.get("sortOrder") || "desc";
  const currentSearch = searchParams.get("search") || "";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset cursor when filters change
    params.delete("cursor");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters =
    currentStatus || currentPriority || currentCategory || currentSearch;

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    updateFilter("search", search.trim());
  };

  return (
    <div
      className="flex flex-col gap-3"
      role="search"
      aria-label="Task filters"
    >
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            name="search"
            type="search"
            placeholder="Search tasks..."
            defaultValue={currentSearch}
            className="pl-9"
            aria-label="Search tasks"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={currentStatus || "all"}
          onValueChange={(v) => updateFilter("status", v)}
        >
          <SelectTrigger
            className="w-[140px]"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentPriority || "all"}
          onValueChange={(v) => updateFilter("priority", v)}
        >
          <SelectTrigger
            className="w-[140px]"
            aria-label="Filter by priority"
          >
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>

        {categories.length > 0 && (
          <Select
            value={currentCategory || "all"}
            onValueChange={(v) => updateFilter("categoryId", v)}
          >
            <SelectTrigger
              className="w-[160px]"
              aria-label="Filter by category"
            >
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={`${currentSort}:${currentOrder}`}
          onValueChange={(v) => {
            const [sortBy, sortOrder] = v.split(":");
            const params = new URLSearchParams(searchParams.toString());
            params.set("sortBy", sortBy);
            params.set("sortOrder", sortOrder);
            params.delete("cursor");
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <SelectTrigger className="w-[160px]" aria-label="Sort tasks">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:desc">Newest first</SelectItem>
            <SelectItem value="createdAt:asc">Oldest first</SelectItem>
            <SelectItem value="dueDate:asc">Due date (soon)</SelectItem>
            <SelectItem value="dueDate:desc">Due date (later)</SelectItem>
            <SelectItem value="priority:asc">Priority (high)</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear all filters"
          >
            <X className="mr-1 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
