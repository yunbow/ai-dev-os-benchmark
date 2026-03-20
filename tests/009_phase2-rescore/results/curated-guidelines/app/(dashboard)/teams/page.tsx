import { Suspense } from "react";
import { getTeams } from "@/features/teams/server/team-actions";
import TeamList from "@/components/teams/TeamList";
import CreateTeamButton from "@/components/teams/CreateTeamButton";

async function TeamsSection() {
  const result = await getTeams();
  if (!result.success) {
    return <p className="text-red-600">Failed to load teams</p>;
  }
  return <TeamList initialData={result.data} />;
}

export default function TeamsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <CreateTeamButton />
      </div>
      <Suspense fallback={
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      }>
        <TeamsSection />
      </Suspense>
    </div>
  );
}
