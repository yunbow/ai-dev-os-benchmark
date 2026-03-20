"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { Search, X } from "lucide-react";

export function TaskFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("cursor"); // reset pagination
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    updateParam("search", e.target.value || null);
  }

  function clearAll() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasFilters = searchParams.size > 0;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Search tasks..."
          className="pl-8 w-48 sm:w-64"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={handleSearch}
          aria-label="Search tasks"
        />
      </div>

      <Select value={searchParams.get("status") ?? "ALL"} onValueChange={(v) => updateParam("status", v)}>
        <SelectTrigger className="w-36" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="TODO">To Do</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="DONE">Done</SelectItem>
        </SelectContent>
      </Select>

      <Select value={searchParams.get("priority") ?? "ALL"} onValueChange={(v) => updateParam("priority", v)}>
        <SelectTrigger className="w-36" aria-label="Filter by priority">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All priorities</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
        </SelectContent>
      </Select>

      <Select value={searchParams.get("sortBy") ?? "createdAt"} onValueChange={(v) => updateParam("sortBy", v)}>
        <SelectTrigger className="w-36" aria-label="Sort by">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">Created date</SelectItem>
          <SelectItem value="dueDate">Due date</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
