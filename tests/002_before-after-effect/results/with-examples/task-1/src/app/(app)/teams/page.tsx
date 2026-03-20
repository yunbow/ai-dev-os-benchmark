import Link from "next/link";
import { getUserTeams } from "@/lib/actions/teams";
import { TeamList } from "@/components/teams/team-list";

export default async function TeamsPage() {
  const result = await getUserTeams();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <Link
          href="/teams/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + New team
        </Link>
      </div>

      {!result.success ? (
        <p className="text-red-600">{result.error}</p>
      ) : (
        <TeamList teams={result.data} />
      )}
    </div>
  );
}
