"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, TaskPriority, TaskStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTask } from "@/actions/task";
import { useToast } from "@/hooks/use-toast";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations/task";

interface TaskFormProps {
  categories: Pick<Category, "id" | "name" | "color">[];
  teamId?: string;
  onSuccess?: () => void;
}

export function TaskForm({ categories, teamId, onSuccess }: TaskFormProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    },
  });

  async function handleTaskCreate(data: CreateTaskInput) {
    const formData = new FormData();
    formData.set("title", data.title);
    if (data.description) formData.set("description", data.description);
    formData.set("status", data.status);
    formData.set("priority", data.priority);
    if (data.dueDate) formData.set("dueDate", data.dueDate.toISOString());
    if (data.categoryId) formData.set("categoryId", data.categoryId);
    if (data.assigneeId) formData.set("assigneeId", data.assigneeId);
    if (teamId) formData.set("teamId", teamId);

    const result = await createTask(formData);

    if (result.success) {
      toast({ title: "Task created" });
      reset();
      onSuccess?.();
    } else {
      toast({ variant: "destructive", title: "Failed to create task", description: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit(handleTaskCreate)} className="space-y-4" noValidate>
      <div className="space-y-1">
        <Label htmlFor="task-title">Title <span aria-hidden="true">*</span></Label>
        <Input
          id="task-title"
          maxLength={200}
          aria-required="true"
          aria-describedby={errors.title ? "task-title-error" : undefined}
          aria-invalid={!!errors.title}
          {...register("title")}
        />
        {errors.title && (
          <p id="task-title-error" className="text-xs text-destructive" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="task-description">Description</Label>
        <textarea
          id="task-description"
          maxLength={2000}
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby={errors.description ? "task-desc-error" : undefined}
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        {errors.description && (
          <p id="task-desc-error" className="text-xs text-destructive" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="task-priority">Priority</Label>
          <Select
            defaultValue={TaskPriority.MEDIUM}
            onValueChange={(val) => setValue("priority", val as TaskPriority)}
          >
            <SelectTrigger id="task-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
              <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
              <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="task-status">Status</Label>
          <Select
            defaultValue={TaskStatus.TODO}
            onValueChange={(val) => setValue("status", val as TaskStatus)}
          >
            <SelectTrigger id="task-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="task-due">Due Date</Label>
          <Input
            id="task-due"
            type="date"
            aria-describedby={errors.dueDate ? "task-due-error" : undefined}
            aria-invalid={!!errors.dueDate}
            {...register("dueDate")}
          />
          {errors.dueDate && (
            <p id="task-due-error" className="text-xs text-destructive" role="alert">
              {errors.dueDate.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="task-category">Category</Label>
          <Select onValueChange={(val) => setValue("categoryId", val)}>
            <SelectTrigger id="task-category">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Task"}
      </Button>
    </form>
  );
}
