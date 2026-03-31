"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center space-y-4">
        <p className="text-red-700 font-medium">データの取得に失敗しました</p>
        <p className="text-sm text-red-500">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    </main>
  );
}
