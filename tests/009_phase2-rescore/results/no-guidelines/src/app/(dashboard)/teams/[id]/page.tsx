import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { TaskCard } from "@/components/tasks/task-card";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { InviteMemberDialog } from "@/components/teams/invite-member-dialog";
import { MemberList } from "@/components/teams/member-list";
import { CreateCategoryDialog } from "@/components/categories/create-category-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TeamRole } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id: teamId } = await params;

  const team = await db.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      },
      categories: { orderBy: { name: "asc" }, select: { id: true, name: true, color: true } },
    },
  });

  if (!team) notFound();

  const currentMember = team.members.find((m) => m.userId === session.user.id);
  if (!currentMember) redirect("/teams");

  const isOwner = currentMember.role === TeamRole.OWNER;
  const canWrite = currentMember.role !== TeamRole.VIEWER;

  const teamMembers = team.members.map((m) => ({
    id: m.userId,
    name: m.user.name,
    email: m.user.email,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <Badge variant="secondary">{currentMember.role}</Badge>
          </div>
          {team.description && (
            <p className="text-muted-foreground mt-1">{team.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {canWrite && (
            <CreateTaskDialog
              categories={team.categories}
              teamMembers={teamMembers}
              teamId={teamId}
            />
          )}
          {isOwner && <InviteMemberDialog teamId={teamId} />}
        </div>
      </div>

      <section aria-labelledby="members-heading">
        <h2 id="members-heading" className="text-lg font-semibold mb-3">
          Members ({team.members.length})
        </h2>
        <MemberList
          members={team.members}
          teamId={teamId}
          currentUserId={session.user.id}
          isOwner={isOwner}
        />
      </section>

      <Separator />

      <section aria-labelledby="tasks-heading">
        <h2 id="tasks-heading" className="text-lg font-semibold mb-3">
          Tasks ({team.tasks.length})
        </h2>
        {team.tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tasks yet. Create the first one!</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.tasks.map((task) => (
              <TaskCard key={task.id} task={task} currentUserId={session.user.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
