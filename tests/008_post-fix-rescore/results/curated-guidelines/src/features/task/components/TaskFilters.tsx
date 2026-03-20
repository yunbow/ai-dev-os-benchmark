"use client";

import { useCallback } from "react";
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
import { TaskStatus, TaskPriority } from "@prisma/client";
import { useDebouncedCallback } from "use-debounce";

interface TaskFiltersProps {
  defaultValues?: {
    search?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    sortBy?: string;
    sortOrder?: string;
  };
}

export function TaskFilters({ defaultValues = {} }: TaskFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("cursor"); // Reset pagination on filter change
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleSearch = useDebouncedCallback((value: string) => {
    updateParam("search", value);
  }, 400);

  function handleClearFilters() {
    router.push(pathname);
  }

  const hasActiveFilters =
    searchParams.has("status") ||
    searchParams.has("priority") ||
    searchParams.has("search");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          defaultValue={defaultValues.search ?? searchParams.get("search") ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        defaultValue={
          defaultValues.status ?? searchParams.get("status") ?? "all"
        }
        onValueChange={(v) => updateParam("status", v)}
      >
        <SelectTrigger className="w-[140px]">
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
        defaultValue={
          defaultValues.priority ?? searchParams.get("priority") ?? "all"
        }
        onValueChange={(v) => updateParam("priority", v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
          <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
          <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue={
          `${searchParams.get("sortBy") ?? "createdAt"}_${searchParams.get("sortOrder") ?? "desc"}`
        }
        onValueChange={(v) => {
          const [sortBy, sortOrder] = v.split("_");
          updateParam("sortBy", sortBy);
          updateParam("sortOrder", sortOrder);
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt_desc">Newest first</SelectItem>
          <SelectItem value="createdAt_asc">Oldest first</SelectItem>
          <SelectItem value="dueDate_asc">Due date (soon)</SelectItem>
          <SelectItem value="dueDate_desc">Due date (late)</SelectItem>
          <SelectItem value="priority_desc">Priority (high)</SelectItem>
          <SelectItem value="priority_asc">Priority (low)</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="gap-1 text-muted-foreground"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
