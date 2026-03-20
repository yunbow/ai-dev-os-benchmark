"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface CursorPaginationProps {
  hasNextPage: boolean;
  nextCursor?: string;
  onLoadMore: (cursor: string) => void;
  isLoading?: boolean;
  total?: number;
  currentCount?: number;
}

export function CursorPagination({
  hasNextPage,
  nextCursor,
  onLoadMore,
  isLoading,
  total,
  currentCount,
}: CursorPaginationProps) {
  if (!hasNextPage && !total) return null;

  return (
    <div className="flex items-center justify-between py-4">
      {total !== undefined && currentCount !== undefined && (
        <p className="text-sm text-gray-500">
          Showing {currentCount} of {total} items
        </p>
      )}
      {hasNextPage && nextCursor && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onLoadMore(nextCursor)}
          disabled={isLoading}
          className="ml-auto"
        >
          Load more
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
