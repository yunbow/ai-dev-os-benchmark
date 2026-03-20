import { notFound } from "next/navigation";
import { getTaskAction } from "@/features/tasks/server/task-actions";
import { listCategoriesAction } from "@/features/categories/server/category-actions";
import { TaskForm } from "@/features/tasks/components/TaskForm";

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;

  const [taskResult, categoriesResult] = await Promise.all([
    getTaskAction(id),
    listCategoriesAction(),
  ]);

  if (!taskResult.success) notFound();

  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <section aria-labelledby="edit-task-heading" className="max-w-2xl">
      <h1 id="edit-task-heading" className="mb-6 text-2xl font-bold">Edit Task</h1>
      <TaskForm task={taskResult.data} categories={categories} />
    </section>
  );
}
