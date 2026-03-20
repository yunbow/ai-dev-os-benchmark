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
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-[var(--color-muted-foreground)]">Failed to load tasks. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
