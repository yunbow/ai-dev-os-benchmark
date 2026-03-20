import { auth } from "@/auth";
import { getTask } from "@/lib/actions/tasks";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/tasks/task-form";
import { StatusToggle } from "@/components/tasks/status-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getCategories } from "@/lib/actions/categories";

interface TaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  // Handle new task case
  if (id === "new") {
    const categoriesResult = await getCategories();
    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/tasks">← Back to Tasks</Link>
          </Button>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Create New Task</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <TaskForm
              categories={categoriesResult.success ? categoriesResult.data : []}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const [taskResult, categoriesResult] = await Promise.all([
    getTask(id),
    getCategories(),
  ]);

  if (!taskResult.success) {
    notFound();
  }

  const task = taskResult.data;
  const isOwner = task.creatorId === session.user.id;

  const priorityColors = {
    HIGH: "destructive",
    MEDIUM: "default",
    LOW: "secondary",
  } as const;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/tasks">← Back to Tasks</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-xl">{task.title}</CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
              <StatusToggle task={task} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {task.dueDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                <p className="mt-1 text-gray-900">
                  {new Date(task.dueDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {task.category && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: task.category.color }}
                  />
                  <span className="text-gray-900">{task.category.name}</span>
                </div>
              </div>
            )}
            {task.assignee && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Assignee</h3>
                <p className="mt-1 text-gray-900">
                  {task.assignee.name ?? task.assignee.email}
                </p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Creator</h3>
              <p className="mt-1 text-gray-900">
                {task.creator.name ?? task.creator.email}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-1 text-gray-900">
                {new Date(task.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Task</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm
              task={task}
              categories={categoriesResult.success ? categoriesResult.data : []}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
