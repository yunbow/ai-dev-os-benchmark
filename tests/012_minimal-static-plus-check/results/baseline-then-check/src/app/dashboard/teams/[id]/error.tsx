"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TeamDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <h2 className="text-xl font-semibold">Failed to load team</h2>
      <p className="text-muted-foreground text-sm">
        The team could not be loaded. You may not have access.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/teams">Back to teams</Link>
        </Button>
      </div>
    </div>
  );
}
