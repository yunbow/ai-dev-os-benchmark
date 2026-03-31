"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TasksError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h2 className="text-lg font-semibold text-red-700 mb-2">
          エラーが発生しました
        </h2>
        <p className="text-sm text-red-600 mb-4">
          タスク一覧の読み込み中に問題が発生しました。
        </p>
        <button
          onClick={reset}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
