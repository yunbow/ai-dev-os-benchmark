import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TaskCard } from "@/components/tasks/task-card";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TaskStatus, TaskPriority, Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

interface SearchParams {
  status?: string;
  priority?: string;
  categoryId?: string;
  search?: string;
  cursor?: string;
  sortBy?: string;
  sortOrder?: string;
}

async function TaskList({ userId, searchParams }: { userId: string; searchParams: SearchParams }) {
  const {
    status,
    priority,
    categoryId,
    search,
    cursor,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = searchParams;

  const where: Prisma.TaskWhereInput = {
    creatorId: userId,
    teamId: null,
    ...(status && Object.values(TaskStatus).includes(status as TaskStatus) && {
      status: status as TaskStatus,
    }),
    ...(priority && Object.values(TaskPriority).includes(priority as TaskPriority) && {
      priority: priority as TaskPriority,
    }),
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(cursor && { id: { lt: cursor } }),
  };

  const validSortBy = ["createdAt", "dueDate", "priority"].includes(sortBy) ? sortBy : "createdAt";
  const validSortOrder = sortOrder === "asc" ? "asc" : "desc";

  const tasks = await db.task.findMany({
    where,
    take: PAGE_SIZE + 1,
    orderBy: { [validSortBy]: validSortOrder },
    include: {
      category: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  const hasMore = tasks.length > PAGE_SIZE;
  const data = tasks.slice(0, PAGE_SIZE);
  const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">No tasks found</p>
        <p className="text-sm mt-1">Create your first task to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((task) => (
          <TaskCard key={task.id} task={task} currentUserId={userId} />
        ))}
      </div>
      {hasMore && nextCursor && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" asChild>
            <Link href={`/tasks?cursor=${nextCursor}`}>Load more</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const categories = await db.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <CreateTaskDialog categories={categories} />
      </div>

      <TaskFilters />

      <Suspense fallback={
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      }>
        <TaskList userId={session.user.id} searchParams={params} />
      </Suspense>
    </div>
  );
}
