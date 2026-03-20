"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
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
    <html lang="en">
      <body>
        <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4" role="alert">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">An unexpected error occurred.</p>
          <Button onClick={reset}>Try again</Button>
        </main>
      </body>
    </html>
  );
}
