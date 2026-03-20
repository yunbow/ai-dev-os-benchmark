"use client";

import React, { useState, useTransition } from "react";
import { createTask, updateTask } from "@/actions/task-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import type { Category, TaskPriority, TaskStatus } from "@prisma/client";

interface TaskFormProps {
  task?: {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date | null;
    categoryId: string | null;
    assigneeId: string | null;
    teamId: string | null;
  };
  categories: Pick<Category, "id" | "name">[];
  teamId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({
  task,
  categories,
  teamId,
  onSuccess,
  onCancel,
}: TaskFormProps) {
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const isEditing = !!task;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      status: formData.get("status") as TaskStatus,
      priority: formData.get("priority") as TaskPriority,
      dueDate: formData.get("dueDate")
        ? new Date(formData.get("dueDate") as string).toISOString()
        : null,
      categoryId: formData.get("categoryId") as string || null,
      teamId: teamId || null,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateTask(task.id, rawData)
        : await createTask(rawData);

      if (result.success) {
        toast({
          variant: "success",
          title: isEditing ? "Task updated" : "Task created",
          description: result.message,
        });
        onSuccess?.();
      } else {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="task-title">
          Title <span aria-hidden="true">*</span>
        </Label>
        <Input
          id="task-title"
          name="title"
          type="text"
          required
          maxLength={200}
          defaultValue={task?.title}
          placeholder="Enter task title"
          aria-describedby={
            fieldErrors.title ? "title-error" : undefined
          }
          aria-invalid={!!fieldErrors.title}
          aria-required="true"
        />
        {fieldErrors.title && (
          <p id="title-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.title[0]}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          name="description"
          maxLength={2000}
          defaultValue={task?.description ?? ""}
          placeholder="Enter task description (optional)"
          rows={3}
          aria-describedby={
            fieldErrors.description ? "description-error" : undefined
          }
          aria-invalid={!!fieldErrors.description}
        />
        {fieldErrors.description && (
          <p
            id="description-error"
            className="text-sm text-destructive"
            role="alert"
          >
            {fieldErrors.description[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="task-status">Status</Label>
          <Select name="status" defaultValue={task?.status || "TODO"}>
            <SelectTrigger id="task-status" aria-label="Task status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="task-priority">Priority</Label>
          <Select name="priority" defaultValue={task?.priority || "MEDIUM"}>
            <SelectTrigger id="task-priority" aria-label="Task priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label htmlFor="task-due-date">Due date</Label>
          <Input
            id="task-due-date"
            name="dueDate"
            type="date"
            defaultValue={
              task?.dueDate
                ? new Date(task.dueDate).toISOString().split("T")[0]
                : ""
            }
          />
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="task-category">Category</Label>
            <Select
              name="categoryId"
              defaultValue={task?.categoryId || "none"}
            >
              <SelectTrigger id="task-category" aria-label="Task category">
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? (
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
