import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import { InviteForm } from "@/components/teams/invite-form";
import { deleteTeam, removeTeamMember } from "@/actions/team";
import { Trash2, UserPlus, UserMinus } from "lucide-react";
import { Suspense } from "react";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const session = await auth();
  const userId = session!.user!.id!;
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
        take: 20,
        include: {
          category: { select: { id: true, name: true, color: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      },
      categories: { select: { id: true, name: true, color: true }, orderBy: { name: "asc" } },
    },
  });

  if (!team) notFound();

  const myMembership = team.members.find((m) => m.userId === userId);
  if (!myMembership) {
    redirect("/teams");
  }

  const isOwner = myMembership.role === "OWNER";
  const canWrite = myMembership.role !== "VIEWER";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
          {team.description && (
            <p className="text-muted-foreground mt-1">{team.description}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {canWrite && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite team member</DialogTitle>
                </DialogHeader>
                <InviteForm teamId={teamId} />
              </DialogContent>
            </Dialog>
          )}
          {isOwner && (
            <form action={deleteTeam.bind(null, teamId)}>
              <Button variant="destructive" size="sm" type="submit" aria-label="Delete team">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Members */}
        <section aria-labelledby="members-heading">
          <h2 id="members-heading" className="font-semibold mb-3">Members</h2>
          <Card>
            <CardContent className="p-0">
              <ul aria-label="Team members">
                {team.members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0" aria-hidden="true">
                      {(member.user.name ?? member.user.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.user.name ?? member.user.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">{member.role}</Badge>
                    {isOwner && member.userId !== userId && member.role !== "OWNER" && (
                      <form action={removeTeamMember.bind(null, teamId, member.userId)}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" type="submit" aria-label={`Remove ${member.user.name ?? member.user.email}`}>
                          <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Tasks */}
        <section className="lg:col-span-2" aria-labelledby="team-tasks-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="team-tasks-heading" className="font-semibold">Tasks</h2>
            {canWrite && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">New Task</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Team Task</DialogTitle>
                  </DialogHeader>
                  <TaskForm categories={team.categories} teamId={teamId} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {team.tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No team tasks yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {team.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  canEdit={canWrite && (task.creatorId === userId || isOwner)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
