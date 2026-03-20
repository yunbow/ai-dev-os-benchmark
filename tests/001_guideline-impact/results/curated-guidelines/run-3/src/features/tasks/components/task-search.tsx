"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TaskSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("search") ?? "");

  const handleSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("cursor");
      if (term) {
        params.set("search", term);
      } else {
        params.delete("search");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const clearSearch = () => {
    setValue("");
    handleSearch("");
  };

  return (
    <div className="relative">
      <Search
        className={cn(
          "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
          isPending ? "text-indigo-500 animate-pulse" : "text-gray-400"
        )}
      />
      <Input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          // Debounce search
          const timeoutId = setTimeout(() => handleSearch(e.target.value), 300);
          return () => clearTimeout(timeoutId);
        }}
        placeholder="Search tasks..."
        className="pl-9 pr-8 w-full sm:w-72"
        aria-label="Search tasks"
      />
      {value && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
