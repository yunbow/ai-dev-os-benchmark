import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { TaskStatus } from "@prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const [totalTasks, todoCount, inProgressCount, doneCount] = await Promise.all([
    prisma.task.count({ where: { creatorId: session.user.id } }),
    prisma.task.count({ where: { creatorId: session.user.id, status: TaskStatus.TODO } }),
    prisma.task.count({ where: { creatorId: session.user.id, status: TaskStatus.IN_PROGRESS } }),
    prisma.task.count({ where: { creatorId: session.user.id, status: TaskStatus.DONE } }),
  ]);

  const stats = [
    { label: "Total Tasks", value: totalTasks },
    { label: "To Do", value: todoCount },
    { label: "In Progress", value: inProgressCount },
    { label: "Done", value: doneCount },
  ];

  return (
    <section aria-labelledby="dashboard-heading">
      <h1 id="dashboard-heading" className="mb-6 text-2xl font-bold">
        Welcome back, {session.user.name ?? session.user.email}
      </h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
