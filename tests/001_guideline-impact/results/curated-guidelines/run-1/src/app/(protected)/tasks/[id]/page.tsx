import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Edit, Trash2, Calendar, User, Tag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getTaskAction } from "@/features/tasks/server/task-actions";
import { TaskStatusToggle } from "@/features/tasks/components/TaskStatusToggle";
import { DeleteTaskButton } from "@/features/tasks/components/DeleteTaskButton";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  HIGH: "bg-red-100 text-red-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
};

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const result = await getTaskAction(id);

  if (!result.success) notFound();

  const task = result.data;

  return (
    <article aria-labelledby="task-title" className="max-w-2xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1
          id="task-title"
          className={cn("text-2xl font-bold", task.status === TaskStatus.DONE && "line-through text-muted-foreground")}
        >
          {task.title}
        </h1>
        <div className="flex shrink-0 gap-2">
          <Link href={`/tasks/${task.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Edit className="mr-1 h-4 w-4" aria-hidden />
            Edit
          </Link>
          <DeleteTaskButton taskId={task.id} />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge className={cn(PRIORITY_COLORS[task.priority])} variant="outline">
          {task.priority} priority
        </Badge>
        <TaskStatusToggle task={task} />
        <Badge className={cn(STATUS_COLORS[task.status])} variant="outline">
          {task.status.replace("_", " ")}
        </Badge>
      </div>

      {task.description && (
        <p className="mb-6 whitespace-pre-wrap text-muted-foreground">{task.description}</p>
      )}

      <Separator className="my-4" />

      <dl className="space-y-3 text-sm">
        {task.dueDate && (
          <div className="flex items-center gap-2">
            <dt className="flex items-center gap-1 text-muted-foreground w-24">
              <Calendar className="h-4 w-4" aria-hidden />
              Due
            </dt>
            <dd>{format(new Date(task.dueDate), "MMMM d, yyyy")}</dd>
          </div>
        )}
        {task.assignee && (
          <div className="flex items-center gap-2">
            <dt className="flex items-center gap-1 text-muted-foreground w-24">
              <User className="h-4 w-4" aria-hidden />
              Assignee
            </dt>
            <dd>{task.assignee.name ?? task.assignee.email}</dd>
          </div>
        )}
        {task.category && (
          <div className="flex items-center gap-2">
            <dt className="flex items-center gap-1 text-muted-foreground w-24">
              <Tag className="h-4 w-4" aria-hidden />
              Category
            </dt>
            <dd className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: task.category.color }}
                aria-hidden
              />
              {task.category.name}
            </dd>
          </div>
        )}
        <div className="flex items-center gap-2">
          <dt className="text-muted-foreground w-24">Created</dt>
          <dd>{format(new Date(task.createdAt), "MMM d, yyyy")}</dd>
        </div>
      </dl>
    </article>
  );
}
