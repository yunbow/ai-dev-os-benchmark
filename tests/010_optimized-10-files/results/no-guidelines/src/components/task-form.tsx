"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { taskSchema, type TaskInput } from "@/lib/validations";
import { createTask, updateTask } from "@/actions/tasks";
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
import { useToast } from "@/components/ui/use-toast";
import type { TaskStatus, TaskPriority } from "@prisma/client";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface TeamMember {
  user: { id: string; name: string | null; email: string };
}

interface TaskFormDefaultValues {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  categoryId?: string | null;
  assigneeId?: string | null;
  id?: string;
  updatedAt?: string;
}

interface TaskFormProps {
  taskId?: string;
  defaultValues?: TaskFormDefaultValues;
  categories?: Category[];
  teamMembers?: TeamMember[];
  onSuccess?: () => void;
}

export function TaskForm({
  taskId,
  defaultValues,
  categories = [],
  teamMembers = [],
  onSuccess,
}: TaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      status: (defaultValues?.status as TaskStatus) ?? "TODO",
      priority: (defaultValues?.priority as TaskPriority) ?? "MEDIUM",
      dueDate: defaultValues?.dueDate ?? null,
      categoryId: defaultValues?.categoryId ?? null,
      assigneeId: defaultValues?.assigneeId ?? null,
    },
  });

  const status = watch("status");
  const priority = watch("priority");

  function onSubmit(data: TaskInput) {
    startTransition(async () => {
      let result;

      if (taskId) {
        result = await updateTask(taskId, {
          ...data,
          updatedAt: defaultValues?.updatedAt,
        });
      } else {
        result = await createTask(data);
      }

      if (!result.success) {
        toast({
          title: taskId ? "Failed to update task" : "Failed to create task",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: taskId ? "Task updated" : "Task created",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/tasks");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Title */}
      <div className="space-y-1">
        <Label htmlFor="task-title">
          Title <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <Input
          id="task-title"
          {...register("title")}
          placeholder="Enter task title"
          aria-describedby={errors.title ? "title-error" : undefined}
          aria-required="true"
          aria-invalid={!!errors.title}
          disabled={isPending}
          maxLength={200}
        />
        {errors.title && (
          <p id="title-error" className="text-xs text-destructive" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          {...register("description")}
          placeholder="Optional description"
          rows={3}
          aria-describedby={errors.description ? "description-error" : undefined}
          aria-invalid={!!errors.description}
          disabled={isPending}
          maxLength={2000}
        />
        {errors.description && (
          <p id="description-error" className="text-xs text-destructive" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Status */}
        <div className="space-y-1">
          <Label htmlFor="task-status">Status</Label>
          <Select
            value={status}
            onValueChange={(val) => setValue("status", val as TaskStatus)}
            disabled={isPending}
          >
            <SelectTrigger id="task-status" aria-label="Task status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-1">
          <Label htmlFor="task-priority">Priority</Label>
          <Select
            value={priority}
            onValueChange={(val) => setValue("priority", val as TaskPriority)}
            disabled={isPending}
          >
            <SelectTrigger id="task-priority" aria-label="Task priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Due Date */}
      <div className="space-y-1">
        <Label htmlFor="task-due-date">Due Date</Label>
        <Input
          id="task-due-date"
          type="datetime-local"
          {...register("dueDate")}
          aria-describedby={errors.dueDate ? "due-date-error" : undefined}
          aria-invalid={!!errors.dueDate}
          disabled={isPending}
        />
        {errors.dueDate && (
          <p id="due-date-error" className="text-xs text-destructive" role="alert">
            {errors.dueDate.message as string}
          </p>
        )}
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor="task-category">Category</Label>
          <Select
            onValueChange={(val) =>
              setValue("categoryId", val === "none" ? null : val)
            }
            disabled={isPending}
          >
            <SelectTrigger id="task-category" aria-label="Task category">
              <SelectValue placeholder="Select category (optional)" />
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

      {/* Assignee */}
      {teamMembers.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor="task-assignee">Assignee</Label>
          <Select
            onValueChange={(val) =>
              setValue("assigneeId", val === "none" ? null : val)
            }
            disabled={isPending}
          >
            <SelectTrigger id="task-assignee" aria-label="Task assignee">
              <SelectValue placeholder="Assign to (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.user.id} value={member.user.id}>
                  {member.user.name ?? member.user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? taskId
              ? "Updating..."
              : "Creating..."
            : taskId
              ? "Update Task"
              : "Create Task"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
