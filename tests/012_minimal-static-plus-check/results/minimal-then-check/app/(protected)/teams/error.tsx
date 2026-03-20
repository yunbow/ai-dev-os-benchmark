"use client";

export default function TeamsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load teams</h2>
        <p className="text-gray-600 mb-4 text-sm">Please try again.</p>
        {error.digest && <p className="text-xs text-gray-400 mb-4">Error ID: {error.digest}</p>}
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
