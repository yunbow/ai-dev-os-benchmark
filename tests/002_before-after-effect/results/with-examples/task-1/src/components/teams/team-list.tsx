import Link from "next/link";
import type { Team, TeamMember } from "@prisma/client";

interface TeamListProps {
  teams: (Team & { members: TeamMember[] })[];
}

export function TeamList({ teams }: TeamListProps) {
  if (teams.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center text-sm text-gray-500 shadow">
        No teams yet. Create your first team!
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {teams.map((team) => (
        <Link
          key={team.id}
          href={`/teams/${team.id}`}
          className="block rounded-lg bg-white p-5 shadow hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-gray-900">{team.name}</h2>
          {team.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {team.description}
            </p>
          )}
          <p className="mt-3 text-xs text-gray-400">
            {team.members.length} member{team.members.length !== 1 ? "s" : ""}
          </p>
        </Link>
      ))}
    </div>
  );
}
