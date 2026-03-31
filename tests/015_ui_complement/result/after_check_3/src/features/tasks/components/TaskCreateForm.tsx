"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { CreateTaskSchema, CreateTaskInput } from "../schema/task-schema";
import { createTaskAction } from "../server/actions";

export function TaskCreateForm() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(CreateTaskSchema),
  });

  const onSubmit = (data: CreateTaskInput) => {
    startTransition(async () => {
      const result = await createTaskAction(data);
      if (result.success) {
        reset();
      } else {
        if (result.error.fieldErrors) {
          for (const [field, messages] of Object.entries(result.error.fieldErrors)) {
            setError(field as keyof CreateTaskInput, { message: messages[0] });
          }
        } else {
          setError("root", { message: result.error.message });
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register("title")}
          disabled={isPending}
          placeholder="タスクのタイトルを入力"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          説明
        </label>
        <textarea
          id="description"
          {...register("description")}
          disabled={isPending}
          placeholder="タスクの説明を入力（任意）"
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      {errors.root && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {errors.root.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "作成中..." : "タスクを作成"}
      </button>
    </form>
  );
}
