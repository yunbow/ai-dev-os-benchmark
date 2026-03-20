"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function TaskFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
        // Reset cursor when filtering
        if (key !== "cursor") params.delete("cursor");
      });
      return params.toString();
    },
    [searchParams]
  );

  const handleFilter = (key: string, value: string | null) => {
    router.push(`${pathname}?${createQueryString({ [key]: value })}`);
  };

  const hasFilters =
    searchParams.has("status") ||
    searchParams.has("priority") ||
    searchParams.has("sortBy");

  const clearFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={searchParams.get("status") ?? ""}
        onValueChange={(v) => handleFilter("status", v || null)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All statuses</SelectItem>
          <SelectItem value="TODO">To Do</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="DONE">Done</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("priority") ?? ""}
        onValueChange={(v) => handleFilter("priority", v || null)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All priorities</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={`${searchParams.get("sortBy") ?? "createdAt"}:${searchParams.get("sortOrder") ?? "desc"}`}
        onValueChange={(v) => {
          const [sortBy, sortOrder] = v.split(":");
          handleFilter("sortBy", sortBy);
          router.push(
            `${pathname}?${createQueryString({ sortBy, sortOrder: sortOrder })}`
          );
        }}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt:desc">Newest first</SelectItem>
          <SelectItem value="createdAt:asc">Oldest first</SelectItem>
          <SelectItem value="dueDate:asc">Due date (soonest)</SelectItem>
          <SelectItem value="priority:desc">Priority (high first)</SelectItem>
          <SelectItem value="title:asc">Title A-Z</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-gray-500"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
