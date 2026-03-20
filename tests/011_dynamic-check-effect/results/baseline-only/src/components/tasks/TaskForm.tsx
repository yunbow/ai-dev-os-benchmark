"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, updateTaskSchema, type CreateTaskInput } from "@/lib/validations/task";
import { createTaskAction, updateTaskAction } from "@/actions/task";
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
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import type { TaskWithRelations } from "@/types";
import { TaskStatus, TaskPriority } from "@prisma/client";

interface TaskFormProps {
  task?: TaskWithRelations;
  categories: { id: string; name: string; color: string }[];
  teams: { id: string; name: string }[];
  currentUserId: string;
  onSuccess?: (task: TaskWithRelations) => void;
}

export function TaskForm({ task, categories, teams, currentUserId, onSuccess }: TaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!task;

  const schema = isEditing ? updateTaskSchema : createTaskSchema;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(schema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          categoryId: task.categoryId ?? undefined,
          assigneeId: task.assigneeId ?? undefined,
          teamId: task.teamId ?? undefined,
        }
      : {
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        },
  });

  const onSubmit = async (data: CreateTaskInput) => {
    setIsLoading(true);
    try {
      if (isEditing && task) {
        const result = await updateTaskAction(task.id, { ...data, updatedAt: task.updatedAt });
        if (result.success) {
          toast({ title: "Task updated" });
          onSuccess?.(result.data);
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      } else {
        const result = await createTaskAction(data);
        if (result.success) {
          toast({ title: "Task created" });
          if (onSuccess) {
            onSuccess(result.data);
          } else {
            router.push(`/tasks/${result.data.id}`);
          }
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span aria-hidden="true" className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Task title"
              aria-describedby={errors.title ? "title-error" : undefined}
              aria-required="true"
              {...register("title")}
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-red-600" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              rows={4}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-600" role="alert">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={watch("status") ?? TaskStatus.TODO}
                onValueChange={(v) => setValue("status", v as TaskStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
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
                defaultValue={watch("priority") ?? TaskPriority.MEDIUM}
                onValueChange={(v) => setValue("priority", v as TaskPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
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
            />
          </div>

          {categories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                defaultValue={watch("categoryId") ?? ""}
                onValueChange={(v) => setValue("categoryId", v || null)}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: cat.color }}
                          aria-hidden="true"
                        />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {teams.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="teamId">Team</Label>
              <Select
                defaultValue={watch("teamId") ?? ""}
                onValueChange={(v) => setValue("teamId", v || null)}
              >
                <SelectTrigger id="teamId">
                  <SelectValue placeholder="Select team (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Personal task</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
