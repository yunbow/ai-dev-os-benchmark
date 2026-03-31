"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema } from "../schema/task";
import { createTaskAction } from "../server/actions";
import type { CreateTaskInput } from "../types/task";

export function TaskForm() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { status: "todo" },
  });

  const onSubmit = (data: CreateTaskInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", data.title);
      if (data.description) formData.set("description", data.description);
      formData.set("status", data.status);

      const result = await createTaskAction(formData);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof CreateTaskInput, {
              message: messages[0],
            });
          }
        }
        return;
      }

      reset();
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-lg border border-gray-200 bg-white p-6"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        タスクを作成
      </h2>

      <div className="space-y-4">
        {/* タイトル */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            placeholder="タスクのタイトルを入力"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* 説明 */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            説明
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows={3}
            placeholder="タスクの説明を入力（任意）"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* ステータス */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            ステータス
          </label>
          <select
            id="status"
            {...register("status")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="todo">未着手</option>
            <option value="in_progress">進行中</option>
            <option value="done">完了</option>
          </select>
        </div>

        {/* 送信ボタン（二重送信防止） */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "作成中..." : "タスクを作成"}
        </button>
      </div>
    </form>
  );
}
