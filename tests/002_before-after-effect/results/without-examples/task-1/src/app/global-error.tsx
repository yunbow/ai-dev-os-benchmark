"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold">Critical Error</h2>
            <p className="mt-2 text-gray-600">
              A critical error occurred. Please refresh the page.
            </p>
            {/* Only expose digest, never error.message or stack */}
            {error.digest && (
              <p className="mt-2 text-xs text-gray-400">
                Error ID: {error.digest}
              </p>
            )}
            <button
              className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={reset}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
