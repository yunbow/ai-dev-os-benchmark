"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TasksError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service (never expose stack trace to user)
    console.error("Tasks page error:", error.message);
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center px-4"
    >
      <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          We couldn&apos;t load your tasks. Please try again.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
