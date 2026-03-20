"use client";

import { useEffect } from "react";

interface LayoutErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProtectedLayoutError({ error, reset }: LayoutErrorProps) {
  useEffect(() => {
    if (error.digest) console.error("Protected area error:", error.digest);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4">
      <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
      <p className="text-sm text-gray-500 text-center">
        An unexpected error occurred.
        {error.digest && (
          <span className="block text-xs text-gray-400 mt-1">Error ID: {error.digest}</span>
        )}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
