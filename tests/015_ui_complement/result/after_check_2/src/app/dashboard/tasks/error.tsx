"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function TasksError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-red-800">
          エラーが発生しました
        </h2>
        <p className="mb-4 text-sm text-red-600">
          タスクの読み込みに失敗しました。再度お試しください。
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          再試行
        </button>
      </div>
    </main>
  );
}
