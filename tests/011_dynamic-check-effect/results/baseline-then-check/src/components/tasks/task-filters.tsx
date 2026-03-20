"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function TaskFilters() {
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
    [pathname, router, searchParams]
  );

  const hasFilters =
    searchParams.has("status") ||
    searchParams.has("priority") ||
    searchParams.has("search");

  return (
    <div className="flex flex-wrap gap-2 items-center" role="search" aria-label="Filter tasks">
      <Input
        type="search"
        placeholder="Search tasks..."
        defaultValue={searchParams.get("search") ?? ""}
        className="w-48"
        onChange={(e) => {
          const val = e.target.value.trim();
          updateFilter("search", val || null);
        }}
        aria-label="Search tasks by title or description"
      />

      <Select
        value={searchParams.get("status") ?? ""}
        onValueChange={(val) => updateFilter("status", val || null)}
      >
        <SelectTrigger className="w-36" aria-label="Filter by status">
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
        value={searchParams.get("priority") ?? ""}
        onValueChange={(val) => updateFilter("priority", val || null)}
      >
        <SelectTrigger className="w-36" aria-label="Filter by priority">
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All priorities</SelectItem>
          <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
          <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
          <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("sortBy") ?? "createdAt"}
        onValueChange={(val) => updateFilter("sortBy", val)}
      >
        <SelectTrigger className="w-36" aria-label="Sort by">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">Created date</SelectItem>
          <SelectItem value="dueDate">Due date</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const params = new URLSearchParams();
            router.push(pathname);
          }}
          aria-label="Clear all filters"
        >
          <X className="h-4 w-4 mr-1" aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  );
}
