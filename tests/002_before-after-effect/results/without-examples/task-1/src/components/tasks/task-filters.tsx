"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { CategoryWithCount } from "@/lib/types";
import { TaskStatus, Priority } from "@prisma/client";

interface TaskFiltersProps {
  categories: CategoryWithCount[];
}

export function TaskFilters({ categories }: TaskFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("cursor"); // Reset pagination on filter change
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters =
    searchParams.has("status") ||
    searchParams.has("priority") ||
    searchParams.has("categoryId") ||
    searchParams.has("sortField");

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) => updateFilter("status", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
          <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
          <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("priority") ?? "all"}
        onValueChange={(v) => updateFilter("priority", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value={Priority.HIGH}>High</SelectItem>
          <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
          <SelectItem value={Priority.LOW}>Low</SelectItem>
        </SelectContent>
      </Select>

      {categories.length > 0 && (
        <Select
          value={searchParams.get("categoryId") ?? "all"}
          onValueChange={(v) => updateFilter("categoryId", v === "all" ? null : v)}
        >
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

      <Select
        value={
          searchParams.get("sortField")
            ? `${searchParams.get("sortField")}-${searchParams.get("sortOrder") ?? "desc"}`
            : "createdAt-desc"
        }
        onValueChange={(v) => {
          const [field, order] = v.split("-");
          updateFilter("sortField", field);
          updateFilter("sortOrder", order);
        }}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt-desc">Newest first</SelectItem>
          <SelectItem value="createdAt-asc">Oldest first</SelectItem>
          <SelectItem value="dueDate-asc">Due date (asc)</SelectItem>
          <SelectItem value="dueDate-desc">Due date (desc)</SelectItem>
          <SelectItem value="priority-desc">Priority (high first)</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
