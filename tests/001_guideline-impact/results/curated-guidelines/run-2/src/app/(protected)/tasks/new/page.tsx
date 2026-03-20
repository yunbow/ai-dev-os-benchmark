import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { TaskForm } from "@/features/tasks/components/task-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "New Task - TaskFlow",
};

export default async function NewTaskPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
