"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TaskDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-12 space-y-4">
      <h2 className="text-xl font-semibold">Failed to load task</h2>
      <p className="text-muted-foreground text-sm">
        The task could not be loaded. It may not exist or you may not have access.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/tasks">Back to tasks</Link>
        </Button>
      </div>
    </div>
  );
}
