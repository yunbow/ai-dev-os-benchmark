"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorMessage } from "@/components/common/error-message";
import { TaskSchema, type TaskInput } from "../schema/task-schema";
import { createTask, updateTask } from "../server/task-actions";
import type { TaskWithRelations } from "../types/task-types";
import type { Category } from "@prisma/client";

interface TaskFormProps {
  task?: TaskWithRelations;
  categories?: Category[];
  onSuccess: (task: TaskWithRelations) => void;
  onCancel: () => void;
}

export function TaskForm({ task, categories, onSuccess, onCancel }: TaskFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput>({
    resolver: zodResolver(TaskSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description ?? undefined,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          categoryId: task.categoryId ?? undefined,
          assigneeId: task.assigneeId ?? undefined,
        }
      : {
          status: "TODO",
          priority: "MEDIUM",
        },
  });

  const status = watch("status");
  const priority = watch("priority");
  const categoryId = watch("categoryId");

  const onSubmit = async (data: TaskInput) => {
    setServerError(null);
    try {
      const result = isEditing
        ? await updateTask(task.id, data)
        : await createTask(data);

      if (!result.success) {
        setServerError(result.error.message);
        return;
      }

      onSuccess(result.data);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ErrorMessage message={serverError} />

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Enter task title"
          {...register("title")}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="text-xs text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          className="flex min-h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          placeholder="Add a description (optional)"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setValue("status", v as TaskInput["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setValue("priority", v as TaskInput["priority"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          {...register("dueDate")}
          defaultValue={
            task?.dueDate
              ? format(new Date(task.dueDate), "yyyy-MM-dd")
              : undefined
          }
        />
      </div>

      {categories && categories.length > 0 && (
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={categoryId ?? ""}
            onValueChange={(v) => setValue("categoryId", v || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No category</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full inline-block"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Saving..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Save changes"
          ) : (
            "Create task"
          )}
        </Button>
      </div>
    </form>
  );
}
