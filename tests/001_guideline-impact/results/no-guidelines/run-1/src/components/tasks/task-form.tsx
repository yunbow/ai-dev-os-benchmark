"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { createTask, updateTask } from "@/lib/actions/task";
import type { TaskWithRelations, ActionResult } from "@/types";
import type { Category } from "@prisma/client";

interface TaskFormProps {
  task?: TaskWithRelations;
  categories?: Category[];
  teamId?: string;
  onSuccess?: () => void;
}

export function TaskForm({ task, categories = [], teamId, onSuccess }: TaskFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    if (teamId) formData.set("teamId", teamId);

    startTransition(async () => {
      let result: ActionResult;
      if (task) {
        result = await updateTask(task.id, formData);
      } else {
        result = await createTask(formData);
      }

      if (result.success) {
        toast({ title: task ? "Task updated" : "Task created", variant: "default" });
        formRef.current?.reset();
        onSuccess?.();
        if (!task) router.push("/tasks");
      } else {
        toast({
          title: "Error",
          description: result.error ?? "Something went wrong",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Title <span aria-hidden="true" className="text-red-500">*</span></Label>
        <Input
          id="title"
          name="title"
          defaultValue={task?.title}
          maxLength={200}
          required
          aria-required="true"
          placeholder="Task title"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={task?.description ?? ""}
          maxLength={2000}
          rows={3}
          placeholder="Optional description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={task?.status ?? "TODO"}>
            <SelectTrigger id="status">
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
          <Select name="priority" defaultValue={task?.priority ?? "MEDIUM"}>
            <SelectTrigger id="priority">
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
          type="datetime-local"
          defaultValue={task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ""}
        />
      </div>

      {categories.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor="categoryId">Category</Label>
          <Select name="categoryId" defaultValue={task?.categoryId ?? ""}>
            <SelectTrigger id="categoryId">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : task ? "Update Task" : "Create Task"}
      </Button>
    </form>
  );
}
