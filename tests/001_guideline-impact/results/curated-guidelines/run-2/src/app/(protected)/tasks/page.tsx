import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { TaskList } from "@/features/tasks/components/task-list";
import { TaskFilters } from "@/features/tasks/components/task-filters";
import { TaskSearch } from "@/features/tasks/components/task-search";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { TaskWithRelations } from "@/features/tasks/types/task-types";

export const metadata = {
  title: "Tasks - TaskFlow",
};

interface TasksPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    search?: string;
    cursor?: string;
  }>;
}

async function TasksContent({
  userId,
  status,
  priority,
  search,
}: {
  userId: string;
  status?: string;
  priority?: string;
  search?: string;
}) {
  const where = {
    OR: [
      { creatorId: userId },
      { assigneeId: userId },
    ] as Record<string, unknown>[],
    ...(status && Object.values(TaskStatus).includes(status as TaskStatus) && {
      status: status as TaskStatus,
    }),
    ...(priority && Object.values(TaskPriority).includes(priority as TaskPriority) && {
      priority: priority as TaskPriority,
    }),
    ...(search && {
      AND: [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        },
      ],
    }),
  };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return <TaskList tasks={tasks as TaskWithRelations[]} />;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { status, priority, search } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <TaskSearch />
        </div>
        <TaskFilters />
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <TasksContent
          userId={session.user.id}
          status={status}
          priority={priority}
          search={search}
        />
      </Suspense>
    </div>
  );
}
