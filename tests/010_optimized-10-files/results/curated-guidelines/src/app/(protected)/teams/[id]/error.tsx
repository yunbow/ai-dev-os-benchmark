"use client";

import { useEffect } from "react";

interface TeamDetailErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TeamDetailError({ error, reset }: TeamDetailErrorProps) {
  useEffect(() => {
    if (error.digest) console.error("Team detail error:", error.digest);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-lg font-semibold text-gray-900">Failed to load team</h2>
      {error.digest && <span className="text-xs text-gray-400">Error ID: {error.digest}</span>}
      <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
        Try again
      </button>
    </div>
  );
}
