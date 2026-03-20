import { getTeams } from "@/lib/actions/teams";
import { TeamList } from "@/components/teams/team-list";
import { TeamForm } from "@/components/teams/team-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Teams - TaskFlow",
};

export default async function TeamsPage() {
  const teamsResult = await getTeams();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Teams</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {teamsResult.success ? (
            <TeamList teams={teamsResult.data} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              Failed to load teams.
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create Team</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
