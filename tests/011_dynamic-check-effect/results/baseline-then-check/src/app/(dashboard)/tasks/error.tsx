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
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16" role="alert">
      <h2 className="text-xl font-semibold">Failed to load tasks</h2>
      <p className="text-muted-foreground text-sm">An error occurred while loading your tasks.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
