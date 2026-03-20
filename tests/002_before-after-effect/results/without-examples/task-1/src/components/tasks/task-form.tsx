"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { createTaskSchema, updateTaskSchema, type CreateTaskInput } from "@/lib/validations/task";
import { createTask, updateTask, deleteTask } from "@/lib/actions/tasks";
import type { TaskWithRelations, CategoryWithCount } from "@/lib/types";
import { TaskStatus, Priority } from "@prisma/client";

interface TaskFormProps {
  task?: TaskWithRelations;
  categories: CategoryWithCount[];
}

export function TaskForm({ task, categories }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!task;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(isEdit ? updateTaskSchema : createTaskSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ?? undefined,
          categoryId: task.categoryId ?? undefined,
          assigneeId: task.assigneeId ?? undefined,
        }
      : {
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
        },
  });

  const status = watch("status");
  const priority = watch("priority");

  const onSubmit = async (data: CreateTaskInput) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.set("title", data.title);
      if (data.description) formData.set("description", data.description);
      formData.set("status", data.status ?? TaskStatus.TODO);
      formData.set("priority", data.priority ?? Priority.MEDIUM);
      if (data.dueDate) formData.set("dueDate", data.dueDate.toISOString());
      if (data.categoryId) formData.set("categoryId", data.categoryId);
      if (data.assigneeId) formData.set("assigneeId", data.assigneeId);

      const result = isEdit
        ? await updateTask(task!.id, formData)
        : await createTask(formData);

      if (result.success) {
        toast({
          title: isEdit ? "Task updated" : "Task created",
          description: isEdit
            ? "Your task has been updated."
            : "Your task has been created.",
        });
        if (!isEdit) {
          router.push(`/tasks/${result.data.id}`);
        }
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error.message,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsDeleting(true);
    try {
      const result = await deleteTask(task.id);
      if (result.success) {
        toast({ title: "Task deleted" });
        router.push("/tasks");
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error.message,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Task title"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional description..."
          rows={3}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setValue("status", v as TaskStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(v) => setValue("priority", v as Priority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Priority.LOW}>Low</SelectItem>
              <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
              <SelectItem value={Priority.HIGH}>High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          {...register("dueDate", { valueAsDate: true })}
        />
      </div>

      {categories.length > 0 && (
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            onValueChange={(v) => setValue("categoryId", v === "none" ? undefined : v)}
            defaultValue={task?.categoryId ?? "none"}
          >
            <SelectTrigger>
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
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

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Task"}
          </Button>
        )}
      </div>
    </form>
  );
}
