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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-red-800 mb-2">エラーが発生しました</h2>
        <p className="text-sm text-red-600 mb-4">
          タスクの読み込みに失敗しました。しばらく待ってから再試行してください。
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
