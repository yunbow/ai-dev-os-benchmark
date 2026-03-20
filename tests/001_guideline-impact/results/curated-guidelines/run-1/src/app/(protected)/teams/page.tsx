import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTeamsAction } from "@/features/teams/server/team-actions";
import { CreateTeamButton } from "@/features/teams/components/CreateTeamButton";

export default async function TeamsPage() {
  const result = await listTeamsAction();
  const teams = result.success ? result.data : [];

  return (
    <section aria-labelledby="teams-heading">
      <div className="mb-6 flex items-center justify-between">
        <h1 id="teams-heading" className="text-2xl font-bold">Teams</h1>
        <CreateTeamButton />
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden />
          <p className="text-lg font-medium">No teams yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a team to collaborate with others
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Teams list">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/teams/${team.id}`}
                className="flex flex-col gap-2 rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {team.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {team._count.members} {team._count.members === 1 ? "member" : "members"}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
