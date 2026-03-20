import { listCategoriesAction } from "@/features/categories/server/category-actions";
import { TaskForm } from "@/features/tasks/components/TaskForm";

export default async function NewTaskPage() {
  const categoriesResult = await listCategoriesAction();
  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <section aria-labelledby="new-task-heading" className="max-w-2xl">
      <h1 id="new-task-heading" className="mb-6 text-2xl font-bold">New Task</h1>
      <TaskForm categories={categories} />
    </section>
  );
}
