"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[Global Error]", error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-gray-50">
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Something went wrong
            </h2>
            <p className="text-gray-600">
              A critical error occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400">
                Error reference: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
