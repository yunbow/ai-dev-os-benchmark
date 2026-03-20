"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="text-gray-600">
        An unexpected error occurred.
        {error.digest && (
          <span className="ml-1 text-sm text-gray-400">
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <button
        onClick={reset}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
