"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTask } from "@/app/actions/tasks";

const initialState = { error: undefined, success: false };

export default function TaskForm() {
  const [state, formAction, isPending] = useActionState(createTask, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">タスクを追加</h2>
      <form ref={formRef} action={formAction} className="flex gap-3 items-start">
        <div className="flex-1">
          <input
            type="text"
            name="title"
            placeholder="タスクのタイトル（2〜100文字）"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isPending}
            aria-describedby={state.error ? "title-error" : undefined}
          />
          {state.error && (
            <p id="title-error" className="mt-1 text-sm text-red-600">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="mt-1 text-sm text-green-600">タスクを追加しました</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isPending ? "追加中…" : "追加"}
        </button>
      </form>
    </div>
  );
}
