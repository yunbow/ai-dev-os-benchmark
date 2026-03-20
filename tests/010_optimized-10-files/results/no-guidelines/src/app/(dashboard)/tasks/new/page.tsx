import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TaskForm } from "@/components/task-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "New Task",
};

export default async function NewTaskPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const categories = await db.category.findMany({
    where: {
      OR: [
        { userId },
        { team: { members: { some: { userId } } } },
      ],
    },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto">
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
