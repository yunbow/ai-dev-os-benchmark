import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { TaskList } from "@/features/task/components/TaskList";
import { TaskFilters } from "@/features/task/components/TaskFilters";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { TaskStatus, TaskPriority } from "@prisma/client";

interface TasksPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    categoryId?: string;
    teamId?: string;
  }>;
}

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;

  const filters = {
    status: params.status as TaskStatus | undefined,
    priority: params.priority as TaskPriority | undefined,
    search: params.search,
    sortBy: (params.sortBy ?? "createdAt") as "createdAt" | "dueDate" | "priority",
    sortOrder: (params.sortOrder ?? "desc") as "asc" | "desc",
    categoryId: params.categoryId,
    teamId: params.teamId,
    limit: 20,
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <Header title="Tasks" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Tasks</h2>
          <Button asChild>
            <Link href="/tasks/new">
              <Plus className="h-4 w-4" />
              New Task
            </Link>
          </Button>
        </div>

        <div className="mb-4">
          <Suspense fallback={null}>
            <TaskFilters />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <TaskList filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}
