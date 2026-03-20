"use client";

export default function TeamsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold text-gray-900">Failed to load teams</h2>
      <p className="text-sm text-gray-600">
        Something went wrong.{" "}
        {error.digest && (
          <span className="text-gray-400">Error ID: {error.digest}</span>
        )}
      </p>
      <button
        onClick={reset}
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
