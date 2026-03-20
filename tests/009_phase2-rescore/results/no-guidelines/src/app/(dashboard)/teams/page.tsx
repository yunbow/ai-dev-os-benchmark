import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { TeamCard } from "@/components/teams/team-card";

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const teams = await db.team.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const teamsWithRole = teams.map((team) => ({
    ...team,
    currentUserRole: team.members.find((m) => m.userId === session.user.id)?.role,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Teams</h1>
        <CreateTeamDialog />
      </div>
      {teamsWithRole.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No teams yet</p>
          <p className="text-sm mt-1">Create a team to collaborate with others</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teamsWithRole.map((team) => (
            <TeamCard key={team.id} team={team} currentUserId={session.user.id} />
          ))}
        </div>
      )}
    </div>
  );
}
