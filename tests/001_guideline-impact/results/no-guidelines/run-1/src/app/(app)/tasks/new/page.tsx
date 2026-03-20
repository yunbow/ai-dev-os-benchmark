import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TaskForm } from "@/components/tasks/task-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewTaskPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const categories = await db.category.findMany({
    where: { userId, teamId: null },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">New Task</h1>
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
