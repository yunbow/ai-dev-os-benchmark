"use client";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-white shadow rounded-lg p-8 text-center space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
      <p className="text-gray-600 text-sm">An error occurred. Please try again.</p>
      {error.digest && (
        <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Try again
      </button>
    </div>
  );
}
