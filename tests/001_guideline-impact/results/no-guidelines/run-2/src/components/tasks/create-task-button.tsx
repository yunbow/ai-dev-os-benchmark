"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTask } from "@/actions/tasks";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CreateTaskButtonProps {
  categories: Category[];
}

export function CreateTaskButton({ categories }: CreateTaskButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrors({});

    startTransition(async () => {
      const result = await createTask(formData);
      if (!result.success) {
        const errs: Record<string, string> = {};
        if (result.details) {
          Object.entries(result.details).forEach(([k, v]) => { errs[k] = v[0] ?? ""; });
        } else {
          errs.root = result.error;
        }
        setErrors(errs);
      } else {
        toast.success("Task created");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>Add a new task to your list.</DialogDescription>
        </DialogHeader>

        <form id="create-task-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errors.root && (
            <p role="alert" className="text-sm text-[var(--color-destructive)]">{errors.root}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="task-title">Title <span aria-hidden="true">*</span></Label>
            <Input id="task-title" name="title" maxLength={200} required aria-invalid={!!errors.title} />
            {errors.title && <p role="alert" className="text-xs text-[var(--color-destructive)]">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea id="task-description" name="description" maxLength={2000} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select name="priority" defaultValue="MEDIUM">
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              <Select name="status" defaultValue="TODO">
                <SelectTrigger id="task-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-dueDate">Due Date</Label>
              <Input id="task-dueDate" name="dueDate" type="date" />
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="task-category">Category</Label>
                <Select name="categoryId">
                  <SelectTrigger id="task-category">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-task-form" disabled={isPending} aria-busy={isPending}>
            {isPending ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
