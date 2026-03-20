"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function TaskSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (newValue) {
          params.set("search", newValue);
        } else {
          params.delete("search");
        }
        params.delete("cursor"); // Reset pagination
        router.push(`${pathname}?${params.toString()}`);
      }, 300);
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="search"
        placeholder="Search tasks..."
        value={value}
        onChange={handleChange}
        className="pl-9"
      />
    </div>
  );
}
