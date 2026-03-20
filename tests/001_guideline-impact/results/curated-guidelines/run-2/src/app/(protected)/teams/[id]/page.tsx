import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { TeamMembers } from "@/features/teams/components/team-members";
import { TeamWithMembers } from "@/features/teams/types/team-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskList } from "@/features/tasks/components/task-list";
import { TaskWithRelations } from "@/features/tasks/types/task-types";
import { format } from "date-fns";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TeamPageProps) {
  const { id } = await params;
  const team = await prisma.team.findUnique({ where: { id }, select: { name: true } });
  return { title: team ? `${team.name} - TaskFlow` : "Team - TaskFlow" };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!team) notFound();

  const isMember = team.members.some((m) => m.userId === session.user.id);
  if (!isMember) notFound();

  const teamTasks = await prisma.task.findMany({
    where: { teamId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{team.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Created {format(new Date(team.createdAt), "MMMM d, yyyy")}
          </p>
        </CardHeader>
      </Card>

      <TeamMembers team={team as TeamWithMembers} currentUserId={session.user.id} />

      {teamTasks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Team Tasks</h2>
          <TaskList tasks={teamTasks as TaskWithRelations[]} />
        </div>
      )}
    </div>
  );
}
