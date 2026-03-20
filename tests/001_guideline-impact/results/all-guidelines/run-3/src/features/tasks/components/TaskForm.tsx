"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { createTask, updateTask } from "../actions";
import { TaskCreateSchema } from "../schemas";
import type { TaskCreateInput } from "../schemas";
import type { TaskWithRelations } from "../queries";
import type { Category } from "@prisma/client";

interface TaskFormProps {
  task?: TaskWithRelations;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TaskForm({ task, categories, onSuccess, onCancel }: TaskFormProps) {
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<TaskCreateInput>({
    resolver: zodResolver(TaskCreateSchema) as any,
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "MEDIUM",
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
      categoryId: task?.categoryId ?? undefined,
    },
  });

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    let result;
    if (isEditing) {
      result = await updateTask(task.id, { ...data, updatedAt: task.updatedAt });
    } else {
      result = await createTask(data);
    }

    if (result.success) {
      reset();
      onSuccess();
    } else {
      setError("root", { message: result.error.message });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Edit task" : "Create task"}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-lg bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">
              {isEditing ? "Edit Task" : "New Task"}
            </h2>
            <button
              onClick={onCancel}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="px-5 py-4 space-y-4">
              {/* Root error */}
              {errors.root && (
                <div
                  role="alert"
                  className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
                >
                  {errors.root.message}
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <input
                  id="task-title"
                  type="text"
                  {...register("title")}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  aria-required="true"
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? "task-title-error" : undefined}
                  autoFocus
                />
                {errors.title && (
                  <p id="task-title-error" role="alert" className="mt-1 text-xs text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="task-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="task-desc"
                  {...register("description")}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  aria-invalid={!!errors.description}
                />
                {errors.description && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Status + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="task-status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="task-status"
                    {...register("status")}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="task-priority"
                    {...register("priority")}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              {/* Due date + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="task-due" className="block text-sm font-medium text-gray-700 mb-1">
                    Due date
                  </label>
                  <input
                    id="task-due"
                    type="date"
                    {...register("dueDate")}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="task-category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="task-category"
                    {...register("categoryId")}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
