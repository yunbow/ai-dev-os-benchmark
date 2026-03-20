"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error digest for debugging - never log error.message or stack
    if (error.digest) {
      console.error("Error digest:", error.digest);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
        <p className="mt-2 text-gray-600">
          An error occurred. Please try again.
        </p>
        {/* Only show digest, never expose error.message or stack traces */}
        {error.digest && (
          <p className="mt-2 text-xs text-gray-400">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex gap-4 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
