"use client";

import React, { useState, useTransition } from "react";
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
import { createTask, updateTask } from "@/lib/actions/tasks";
import { toast } from "@/hooks/use-toast";
import { createTaskSchema } from "@/lib/validations";
import { z } from "zod";

type TaskFormData = z.infer<typeof createTaskSchema>;

interface Category {
  id: string;
  name: string;
  color: string;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
}

interface TaskFormProps {
  task?: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    categoryId: string | null;
    assigneeId: string | null;
    teamId: string | null;
    updatedAt: Date;
  };
  categories?: Category[];
  teamMembers?: TeamMember[];
  teamId?: string;
  onSuccess?: () => void;
}

export function TaskForm({
  task,
  categories = [],
  teamMembers = [],
  teamId,
  onSuccess,
}: TaskFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || "",
    description: task?.description || "",
    status: (task?.status as TaskFormData["status"]) || "TODO",
    priority: (task?.priority as TaskFormData["priority"]) || "MEDIUM",
    dueDate: task?.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : "",
    categoryId: task?.categoryId || null,
    assigneeId: task?.assigneeId || null,
    teamId: teamId || task?.teamId || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Client-side validation
    const parsed = createTaskSchema.safeParse(formData);
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      let result;
      if (task) {
        result = await updateTask({
          ...formData,
          id: task.id,
          updatedAt: task.updatedAt.toISOString(),
        });
      } else {
        result = await createTask(formData);
      }

      if (result.success) {
        toast({
          title: task ? "Task updated" : "Task created",
          variant: "default",
        });
        onSuccess?.();
        if (!task) {
          router.push("/dashboard/tasks");
        }
      } else {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">
          Title <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter task title"
          maxLength={200}
          aria-required="true"
          aria-describedby={fieldErrors.title ? "title-error" : undefined}
          aria-invalid={!!fieldErrors.title}
        />
        {fieldErrors.title && (
          <p id="title-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.title[0]}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter task description (optional)"
          maxLength={2000}
          rows={4}
          aria-describedby={
            fieldErrors.description ? "description-error" : undefined
          }
          aria-invalid={!!fieldErrors.description}
        />
        {fieldErrors.description && (
          <p id="description-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.description[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                status: value as TaskFormData["status"],
              }))
            }
          >
            <SelectTrigger id="status" aria-label="Select status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                priority: value as TaskFormData["priority"],
              }))
            }
          >
            <SelectTrigger id="priority" aria-label="Select priority">
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

      <div className="space-y-1">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          value={formData.dueDate || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              dueDate: e.target.value || null,
            }))
          }
        />
      </div>

      {categories.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor="categoryId">Category</Label>
          <Select
            value={formData.categoryId || "none"}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                categoryId: value === "none" ? null : value,
              }))
            }
          >
            <SelectTrigger id="categoryId" aria-label="Select category">
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full inline-block"
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

      {teamMembers.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor="assigneeId">Assignee</Label>
          <Select
            value={formData.assigneeId || "none"}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                assigneeId: value === "none" ? null : value,
              }))
            }
          >
            <SelectTrigger id="assigneeId" aria-label="Select assignee">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name || member.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : task ? "Update Task" : "Create Task"}
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
