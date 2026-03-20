"use client";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg bg-white p-8 shadow text-center">
      <h2 className="text-lg font-semibold text-gray-900">Authentication error</h2>
      <p className="mt-2 text-sm text-gray-600">
        Something went wrong.{" "}
        {error.digest && (
          <span className="text-gray-400">Error ID: {error.digest}</span>
        )}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
