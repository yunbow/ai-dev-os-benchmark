import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TaskForm } from "@/components/tasks/task-form";
import { taskFiltersSchema } from "@/lib/validations/task";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Prisma } from "@prisma/client";

interface TasksPageProps {
  searchParams: Promise<Record<string, string>>;
}

async function TaskList({ userId, searchParams }: { userId: string; searchParams: Record<string, string> }) {
  const parsed = taskFiltersSchema.safeParse(searchParams);
  if (!parsed.success) return <p className="text-destructive text-sm">Invalid filter parameters.</p>;

  const { status, priority, categoryId, search, sortBy, sortOrder, cursor, pageSize } = parsed.data;

  const where: Prisma.TaskWhereInput = {
    OR: [{ creatorId: userId }, { assigneeId: userId }],
    ...(status && { status }),
    ...(priority && { priority }),
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const tasks = await db.task.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    take: pageSize + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      category: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  const hasMore = tasks.length > pageSize;
  const data = hasMore ? tasks.slice(0, pageSize) : tasks;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12 text-sm">
        No tasks found. Create your first task!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((task) => (
          <TaskCard key={task.id} task={task} canEdit={task.creatorId === userId} />
        ))}
      </div>
      {hasMore && nextCursor && (
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href={`/tasks?${new URLSearchParams({ ...searchParams, cursor: nextCursor }).toString()}`}>
              Load more
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function TaskListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
    </div>
  );
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth();
  const userId = session!.user!.id!;
  const sp = await searchParams;

  const categories = await db.category.findMany({
    where: { userId },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <TaskForm categories={categories} />
          </DialogContent>
        </Dialog>
      </div>

      <TaskFilters />

      <Suspense key={JSON.stringify(sp)} fallback={<TaskListSkeleton />}>
        <TaskList userId={userId} searchParams={sp} />
      </Suspense>
    </div>
  );
}
