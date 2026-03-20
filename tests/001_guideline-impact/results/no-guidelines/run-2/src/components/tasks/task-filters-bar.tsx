"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransition, useState } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface TaskFiltersBarProps {
  categories: Category[];
  currentParams: Record<string, string>;
}

export function TaskFiltersBar({ categories, currentParams }: TaskFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentParams.search ?? "");

  function updateParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(currentParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("cursor");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", search || undefined);
  }

  function clearFilters() {
    setSearch("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasFilters = Object.keys(currentParams).some(
    (k) => k !== "cursor" && currentParams[k]
  );

  return (
    <div className="mb-4 space-y-3" role="search" aria-label="Filter tasks">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search tasks by title or description"
          />
        </div>
        <Button type="submit" variant="outline" disabled={isPending}>
          Search
        </Button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={currentParams.status ?? "all"}
          onValueChange={(v) => updateParam("status", v)}
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
          value={currentParams.priority ?? "all"}
          onValueChange={(v) => updateParam("priority", v)}
        >
          <SelectTrigger className="w-32" aria-label="Filter by priority">
            <SelectValue placeholder="Priority" />
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
            value={currentParams.categoryId ?? "all"}
            onValueChange={(v) => updateParam("categoryId", v)}
          >
            <SelectTrigger className="w-36" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={`${currentParams.sortField ?? "createdAt"}-${currentParams.sortDirection ?? "desc"}`}
          onValueChange={(v) => {
            const [field, dir] = v.split("-");
            const params = new URLSearchParams(currentParams);
            params.set("sortField", field);
            params.set("sortDirection", dir);
            params.delete("cursor");
            startTransition(() => router.push(`${pathname}?${params.toString()}`));
          }}
        >
          <SelectTrigger className="w-40" aria-label="Sort tasks">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest first</SelectItem>
            <SelectItem value="createdAt-asc">Oldest first</SelectItem>
            <SelectItem value="dueDate-asc">Due date (asc)</SelectItem>
            <SelectItem value="dueDate-desc">Due date (desc)</SelectItem>
            <SelectItem value="priority-desc">Priority (high first)</SelectItem>
            <SelectItem value="priority-asc">Priority (low first)</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} disabled={isPending}>
            <X className="mr-1 h-3 w-3" aria-hidden="true" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
