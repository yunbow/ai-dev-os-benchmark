"use client";

import { useState } from "react";
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
import { createTask, updateTask } from "@/features/task/server/task-actions";
import { toast } from "@/hooks/useToast";
import { TaskStatus, TaskPriority, type Category } from "@prisma/client";
import type { TaskWithRelations } from "@/features/task/services/task-service";
import { Loader2 } from "lucide-react";

interface TaskFormProps {
  task?: TaskWithRelations;
  categories?: Category[];
  teamId?: string;
  onSuccess?: (task: TaskWithRelations) => void;
}

export function TaskForm({ task, categories = [], teamId, onSuccess }: TaskFormProps) {
  const router = useRouter();
  const isEdit = !!task;

  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    const input = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      status: formData.get("status") as TaskStatus,
      priority: formData.get("priority") as TaskPriority,
      dueDate: (formData.get("dueDate") as string) || null,
      categoryId: (formData.get("categoryId") as string) || null,
      teamId: teamId ?? null,
    };

    try {
      const result = isEdit
        ? await updateTask(task.id, input)
        : await createTask(input);

      if (result.success) {
        toast({
          title: isEdit ? "Task updated" : "Task created",
          variant: "default",
        });
        onSuccess?.(result.data);
        if (!onSuccess) {
          router.push(`/tasks/${result.data.id}`);
          router.refresh();
        }
      } else {
        if (result.error.fieldErrors) {
          setFieldErrors(result.error.fieldErrors);
        }
        toast({ title: result.error.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          placeholder="Task title"
          defaultValue={task?.title ?? ""}
          maxLength={200}
          required
          aria-describedby={fieldErrors.title ? "title-error" : undefined}
        />
        {fieldErrors.title && (
          <p id="title-error" className="text-sm text-destructive">
            {fieldErrors.title[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Task description (optional)"
          defaultValue={task?.description ?? ""}
          maxLength={2000}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            name="status"
            defaultValue={task?.status ?? TaskStatus.TODO}
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
          <Label htmlFor="priority">Priority</Label>
          <Select
            name="priority"
            defaultValue={task?.priority ?? TaskPriority.MEDIUM}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
              <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
              <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={
              task?.dueDate
                ? new Date(task.dueDate).toISOString().split("T")[0]
                : ""
            }
          />
        </div>

        {categories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select
              name="categoryId"
              defaultValue={task?.categoryId ?? "none"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
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

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEdit ? "Saving..." : "Creating..."}
            </>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Create task"
          )}
        </Button>
      </div>
    </form>
  );
}
