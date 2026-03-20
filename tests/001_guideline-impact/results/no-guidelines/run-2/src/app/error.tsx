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
      <body className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 text-center" role="alert">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-gray-500 max-w-md">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <Button onClick={reset}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
