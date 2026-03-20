import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { listTasks } from "@/features/tasks/server/task-actions";
import { listCategories } from "@/features/categories/server/category-actions";
import { TasksPageClient } from "@/features/tasks/components/tasks-page-client";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [tasksResult, categoriesResult] = await Promise.all([
    listTasks({ sortBy: "createdAt", sortOrder: "desc" }),
    listCategories(),
  ]);

  if (!tasksResult.success || !categoriesResult.success) {
    throw new Error("Failed to load tasks");
  }

  return (
    <TasksPageClient
      initialTasks={tasksResult.data}
      categories={categoriesResult.data}
    />
  );
}
