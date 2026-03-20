import Link from "next/link";
import { format } from "date-fns";
import { CheckSquare, Square, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { listTasksAction } from "../server/task-actions";
import { listTasksSchema } from "../schema/task-schema";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  LOW: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

interface TaskListProps {
  searchParams: Record<string, string | undefined>;
}

export async function TaskList({ searchParams }: TaskListProps) {
  const parsed = listTasksSchema.safeParse({
    ...searchParams,
    limit: 20,
  });

  const params = parsed.success ? parsed.data : { sortBy: "createdAt" as const, sortOrder: "desc" as const, limit: 20 };
  const result = await listTasksAction(params);

  if (!result.success) {
    return (
      <p className="text-destructive" role="alert">
        Failed to load tasks: {result.error.message}
      </p>
    );
  }

  const { items, nextCursor, hasMore } = result.data;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <CheckSquare className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden />
        <p className="text-lg font-medium">No tasks yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first task to get started
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul className="space-y-2" aria-label="Task list">
        {items.map((task) => (
          <li key={task.id}>
            <Link
              href={`/tasks/${task.id}`}
              className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
            >
              <span aria-hidden className="mt-0.5 shrink-0 text-muted-foreground">
                {task.status === TaskStatus.DONE ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-medium leading-snug",
                    task.status === TaskStatus.DONE && "text-muted-foreground line-through"
                  )}
                >
                  {task.title}
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" aria-hidden />
                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </span>
                  )}
                  {task.assignee && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" aria-hidden />
                      {task.assignee.name ?? task.assignee.email}
                    </span>
                  )}
                  {task.category && (
                    <span
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-white text-xs"
                      style={{ backgroundColor: task.category.color }}
                    >
                      {task.category.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge
                  className={cn("text-xs font-medium", PRIORITY_COLORS[task.priority])}
                  variant="outline"
                >
                  {task.priority}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Link
            href={{ pathname: "/tasks", query: { ...searchParams, cursor: nextCursor } }}
            className={buttonVariants({ variant: "outline" })}
          >
            Load more
          </Link>
        </div>
      )}
    </div>
  );
}
