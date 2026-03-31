"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <h2 className="text-red-800 font-semibold mb-2">エラーが発生しました</h2>
        <p className="text-red-600 text-sm mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
