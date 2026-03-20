"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
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
import { createTaskAction, updateTaskAction } from "../server/task-actions";
import { createTaskSchema, CreateTaskInput } from "../schema/task-schema";
import { Task, TaskStatus, TaskPriority, Category } from "@prisma/client";

interface TaskFormProps {
  task?: Task;
  categories?: Category[];
}

export function TaskForm({ task, categories = [] }: TaskFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const isEditing = !!task;

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? TaskStatus.TODO,
      priority: task?.priority ?? TaskPriority.MEDIUM,
      dueDate: undefined,
      categoryId: task?.categoryId ?? undefined,
    },
  });

  async function onSubmit(values: CreateTaskInput) {
    setIsPending(true);

    const result = isEditing
      ? await updateTaskAction(task!.id, values)
      : await createTaskAction(values);

    setIsPending(false);

    if (!result.success) {
      if (result.error.fieldErrors) {
        Object.entries(result.error.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof CreateTaskInput, {
            type: "server",
            message: messages.join(", "),
          });
        });
      } else {
        toast.error(result.error.message);
      }
      return;
    }

    toast.success(isEditing ? "Task updated" : "Task created");
    router.push("/tasks");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          disabled={isPending}
          {...form.register("title")}
          aria-describedby={form.formState.errors.title ? "title-error" : undefined}
        />
        {form.formState.errors.title && (
          <p id="title-error" className="text-sm text-destructive" role="alert">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          disabled={isPending}
          {...form.register("description")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            defaultValue={form.getValues("status")}
            onValueChange={(v) => form.setValue("status", v as TaskStatus)}
            disabled={isPending}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TaskStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            defaultValue={form.getValues("priority")}
            onValueChange={(v) => form.setValue("priority", v as TaskPriority)}
            disabled={isPending}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TaskPriority).map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            disabled={isPending}
            defaultValue={task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
            onChange={(e) =>
              form.setValue("dueDate", e.target.value ? new Date(e.target.value) : undefined)
            }
          />
        </div>

        {categories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select
              defaultValue={form.getValues("categoryId") ?? "none"}
              onValueChange={(v) =>
                form.setValue("categoryId", v === "none" ? undefined : v || undefined)
              }
              disabled={isPending}
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: c.color }}
                        aria-hidden
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
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
