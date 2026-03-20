import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTeam } from "@/lib/actions/teams";
import { getTasks } from "@/lib/actions/tasks";
import { MemberList } from "@/components/teams/member-list";
import { InviteModal } from "@/components/teams/invite-modal";
import { TaskList } from "@/components/tasks/task-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team Details" };

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const userId = session!.user!.id!;

  const [teamResult, tasksResult] = await Promise.all([
    getTeam(id),
    getTasks({ teamId: id, limit: 20 }),
  ]);

  if (!teamResult.success) notFound();

  const team = teamResult.data;
  const tasks = tasksResult.success ? tasksResult.data : null;

  const currentMember = team.members.find((m) => m.user.id === userId);
  const currentRole = currentMember?.role || "VIEWER";

  const canInvite = currentRole === "OWNER" || currentRole === "MEMBER";
  const isOwner = currentRole === "OWNER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <Badge variant="outline">{currentRole.charAt(0) + currentRole.slice(1).toLowerCase()}</Badge>
          </div>
          {team.description && (
            <p className="text-muted-foreground mt-1">{team.description}</p>
          )}
        </div>
        {canInvite && <InviteModal teamId={id} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Members ({team.members.length})
              </CardTitle>
              <CardDescription>People in this team</CardDescription>
            </CardHeader>
            <CardContent>
              <MemberList
                members={team.members}
                teamId={id}
                currentUserId={userId}
                currentUserRole={currentRole}
              />
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        <div className="lg:col-span-2">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Team Tasks</h2>
            </div>
            {tasks ? (
              <TaskList
                initialTasks={tasks.tasks}
                initialNextCursor={tasks.nextCursor}
                initialHasMore={tasks.hasMore}
                teamId={id}
              />
            ) : (
              <p className="text-muted-foreground">Failed to load tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
