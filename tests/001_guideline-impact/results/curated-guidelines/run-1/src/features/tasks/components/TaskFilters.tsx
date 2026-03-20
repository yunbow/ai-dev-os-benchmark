"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
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

export function TaskFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("cursor");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const hasFilters =
    searchParams.has("status") ||
    searchParams.has("priority") ||
    searchParams.has("search");

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          placeholder="Search tasks..."
          className="pl-9"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => {
            const timeout = setTimeout(() => setParam("search", e.target.value || null), 300);
            return () => clearTimeout(timeout);
          }}
          aria-label="Search tasks"
        />
      </div>

      <Select
        value={searchParams.get("status") ?? "ALL"}
        onValueChange={(v) => setParam("status", v === "ALL" ? null : v)}
      >
        <SelectTrigger className="w-36" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {Object.values(TaskStatus).map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("priority") ?? "ALL"}
        onValueChange={(v) => setParam("priority", v === "ALL" ? null : v)}
      >
        <SelectTrigger className="w-36" aria-label="Filter by priority">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All priorities</SelectItem>
          {Object.values(TaskPriority).map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname)}
          aria-label="Clear all filters"
        >
          <X className="mr-1 h-4 w-4" aria-hidden />
          Clear
        </Button>
      )}
    </div>
  );
}
