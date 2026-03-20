import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { TaskForm } from "@/features/task/components/TaskForm";
import { fetchTaskById } from "@/features/task/services/task-service";
import { canMutateTask } from "@/features/task/services/task-service";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Task" };

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) notFound();

  const [task, canMutate] = await Promise.all([
    fetchTaskById(id, session.user.id),
    canMutateTask(id, session.user.id),
  ]);

  if (!task || !canMutate) notFound();

  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        ...(task.teamId ? [{ teamId: task.teamId }] : []),
      ],
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col overflow-hidden">
      <Header title="Edit Task" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-xl">
          <div className="mb-4">
            <Button variant="ghost" asChild className="gap-2">
              <Link href={`/tasks/${task.id}`}>
                <ArrowLeft className="h-4 w-4" />
                Back to Task
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
            <TaskForm task={task} categories={categories} />
          </div>
        </div>
      </div>
    </div>
  );
}
