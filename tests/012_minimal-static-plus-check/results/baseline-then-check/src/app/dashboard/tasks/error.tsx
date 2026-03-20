"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error monitoring service (not console in production)
    if (process.env.NODE_ENV === "development") {
      console.error("Tasks page error:", error.message);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        An error occurred while loading your tasks. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
