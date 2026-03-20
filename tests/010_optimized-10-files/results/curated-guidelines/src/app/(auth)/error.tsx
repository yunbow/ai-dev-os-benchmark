"use client";

import { useEffect } from "react";
import Link from "next/link";

interface AuthErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthError({ error, reset }: AuthErrorProps) {
  useEffect(() => {
    if (error.digest) console.error("Auth error:", error.digest);
  }, [error]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 mb-4">
        {error.digest && <span className="block text-xs text-gray-400">Error ID: {error.digest}</span>}
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Try again
        </button>
        <Link href="/login" className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
          Back to login
        </Link>
      </div>
    </div>
  );
}
