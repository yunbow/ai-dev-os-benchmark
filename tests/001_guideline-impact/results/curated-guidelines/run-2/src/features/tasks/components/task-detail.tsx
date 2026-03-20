"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, User, Tag, Users, Trash2, Edit, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TaskWithRelations, STATUS_LABELS, PRIORITY_LABELS } from "../types/task-types";
import { deleteTask, toggleTaskStatus } from "../server/task-actions";
import { sanitizeCategoryColor } from "@/features/categories/types/category-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskStatus } from "@prisma/client";

interface TaskDetailProps {
  task: TaskWithRelations;
  isOwner: boolean;
}

const statusVariantMap = {
  TODO: "secondary",
  IN_PROGRESS: "default",
  DONE: "success",
} as const;

export function TaskDetail({ task, isOwner }: TaskDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [, startTransition] = useTransition();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteTask(task.id);
    if (!result.success) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      setIsDeleting(false);
      return;
    }
    toast({ title: "Success", description: "Task deleted" });
    router.push("/tasks");
    router.refresh();
  };

  const handleStatusChange = (status: TaskStatus) => {
    startTransition(async () => {
      const result = await toggleTaskStatus(task.id, status);
      if (!result.success) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tasks
          </Link>
        </Button>
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/tasks/${task.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Task</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this task? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-2xl">{task.title}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant={statusVariantMap[task.status] as "secondary" | "default" | "success"}>
              {STATUS_LABELS[task.status]}
            </Badge>
            <Badge variant="outline">{PRIORITY_LABELS[task.priority]}</Badge>
            {task.category && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: sanitizeCategoryColor(task.category.color) }}
              >
                <Tag className="h-3 w-3" />
                {task.category.name}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              </div>
              <Separator />
            </>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created by</span>
              <div className="flex items-center gap-1 mt-1">
                <User className="h-4 w-4" />
                <span>{task.creator.name ?? task.creator.email}</span>
              </div>
            </div>
            {task.assignee && (
              <div>
                <span className="text-muted-foreground">Assigned to</span>
                <div className="flex items-center gap-1 mt-1">
                  <User className="h-4 w-4" />
                  <span>{task.assignee.name ?? task.assignee.email}</span>
                </div>
              </div>
            )}
            {task.dueDate && (
              <div>
                <span className="text-muted-foreground">Due date</span>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(task.dueDate), "MMMM d, yyyy")}</span>
                </div>
              </div>
            )}
            {task.team && (
              <div>
                <span className="text-muted-foreground">Team</span>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="h-4 w-4" />
                  <span>{task.team.name}</span>
                </div>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="mt-1">{format(new Date(task.createdAt), "MMM d, yyyy")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last updated</span>
              <p className="mt-1">{format(new Date(task.updatedAt), "MMM d, yyyy")}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Update Status</h3>
            <div className="flex gap-2">
              {(["TODO", "IN_PROGRESS", "DONE"] as TaskStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={task.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                  disabled={task.status === status}
                >
                  {STATUS_LABELS[status]}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
