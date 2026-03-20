"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateTask, deleteTask } from "@/actions/tasks";
import type { TaskWithRelations } from "@/types";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

interface TaskDetailProps {
  task: TaskWithRelations;
  currentUserId: string;
  categories: { id: string; name: string; color: string }[];
}

export function TaskDetail({ task, currentUserId, categories }: TaskDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canModify = task.creatorId === currentUserId;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrors({});

    startTransition(async () => {
      const result = await updateTask(task.id, formData);
      if (!result.success) {
        const errs: Record<string, string> = {};
        if (result.details) {
          Object.entries(result.details).forEach(([k, v]) => { errs[k] = v[0] ?? ""; });
        } else {
          errs.root = result.error;
        }
        setErrors(errs);
      } else {
        toast.success("Task updated");
        setEditing(false);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Task deleted");
        router.push("/dashboard/tasks");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        </Button>
      </div>

      {!editing ? (
        <div className="rounded-lg border bg-[var(--color-card)] p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h1 id="task-detail-heading" className="text-xl font-bold">{task.title}</h1>
            {canModify && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {task.description && (
            <p className="text-[var(--color-muted-foreground)] whitespace-pre-wrap">{task.description}</p>
          )}

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="font-medium text-[var(--color-muted-foreground)]">Status</dt>
              <dd><Badge variant="outline">{task.status.replace("_", " ")}</Badge></dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-muted-foreground)]">Priority</dt>
              <dd>{task.priority}</dd>
            </div>
            {task.dueDate && (
              <div>
                <dt className="font-medium text-[var(--color-muted-foreground)]">Due Date</dt>
                <dd><time dateTime={task.dueDate.toISOString()}>{format(task.dueDate, "MMM d, yyyy")}</time></dd>
              </div>
            )}
            {task.category && (
              <div>
                <dt className="font-medium text-[var(--color-muted-foreground)]">Category</dt>
                <dd>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: task.category.color }}
                  >
                    {task.category.name}
                  </span>
                </dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-[var(--color-muted-foreground)]">Created</dt>
              <dd><time dateTime={task.createdAt.toISOString()}>{format(task.createdAt, "MMM d, yyyy")}</time></dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-muted-foreground)]">Created by</dt>
              <dd>{task.creator.name ?? task.creator.email}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-[var(--color-card)] p-6 space-y-4">
          <h1 id="task-detail-heading" className="text-xl font-bold">Edit Task</h1>

          {errors.root && (
            <p role="alert" className="text-sm text-[var(--color-destructive)]">{errors.root}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" name="title" defaultValue={task.title} maxLength={200} required aria-invalid={!!errors.title} />
            {errors.title && <p role="alert" className="text-xs text-[var(--color-destructive)]">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" name="description" defaultValue={task.description ?? ""} maxLength={2000} rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select name="status" defaultValue={task.status}>
                <SelectTrigger id="edit-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select name="priority" defaultValue={task.priority}>
                <SelectTrigger id="edit-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                name="dueDate"
                type="date"
                defaultValue={task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : ""}
              />
            </div>
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select name="categoryId" defaultValue={task.categoryId ?? ""}>
                  <SelectTrigger id="edit-category"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
