import type { Metadata } from "next";
import { getTeams } from "@/features/teams/server/team-actions";
import { TeamList } from "@/features/teams/components/team-list";

export const metadata: Metadata = {
  title: "Teams",
};

export default async function TeamsPage() {
  const result = await getTeams();
  const teams = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <p className="mt-1 text-gray-500">
          Collaborate with your team members on tasks.
        </p>
      </div>

      {!result.success && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Failed to load teams: {result.error.message}
        </div>
      )}

      <TeamList initialTeams={teams} />
    </div>
  );
}
