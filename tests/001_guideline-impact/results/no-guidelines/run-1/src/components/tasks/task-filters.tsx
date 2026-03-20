"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function TaskFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("cursor"); // Reset pagination on filter change
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap gap-3" role="search" aria-label="Filter tasks">
      <div className="relative min-w-48">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input
          className="pl-9"
          placeholder="Search tasks..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => {
            const timer = setTimeout(() => updateFilter("search", e.target.value), 300);
            return () => clearTimeout(timer);
          }}
          aria-label="Search tasks"
        />
      </div>

      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) => updateFilter("status", v)}
      >
        <SelectTrigger className="w-36" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="TODO">To Do</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="DONE">Done</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("priority") ?? "all"}
        onValueChange={(v) => updateFilter("priority", v)}
      >
        <SelectTrigger className="w-36" aria-label="Filter by priority">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("sortBy") ?? "createdAt"}
        onValueChange={(v) => updateFilter("sortBy", v)}
      >
        <SelectTrigger className="w-40" aria-label="Sort by">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">Created date</SelectItem>
          <SelectItem value="dueDate">Due date</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} aria-label="Clear all filters">
          <X className="h-4 w-4 mr-1" aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  );
}
