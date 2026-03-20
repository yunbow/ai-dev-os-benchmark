import { auth } from "@/auth";
import { getTasks } from "@/lib/actions/tasks";
import { getCategories } from "@/lib/actions/categories";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskSearch } from "@/components/tasks/task-search";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Tasks - TaskFlow",
};

interface TasksPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const params = await searchParams;

  const [tasksResult, categoriesResult] = await Promise.all([
    getTasks(params),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <Button asChild>
          <Link href="/tasks/new">New Task</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <TaskSearch />
        <TaskFilters
          categories={categoriesResult.success ? categoriesResult.data : []}
        />
      </div>

      {tasksResult.success ? (
        <TaskList
          initialData={tasksResult.data}
          currentParams={params}
        />
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>Failed to load tasks. Please try again.</p>
        </div>
      )}
    </div>
  );
}
