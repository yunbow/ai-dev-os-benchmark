import { auth } from "@/lib/auth";
import { getCategories } from "@/lib/actions/categories";
import { TaskForm } from "@/components/tasks/task-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Task" };

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ teamId?: string }>;
}) {
  const session = await auth();
  const { teamId } = await searchParams;

  const categoriesResult = await getCategories(teamId);
  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Task</h1>
        <p className="text-muted-foreground">
          Add a new task to your list
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm
            categories={categories}
            teamId={teamId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
