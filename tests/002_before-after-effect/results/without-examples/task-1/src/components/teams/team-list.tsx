import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { TeamWithMembers } from "@/lib/types";
import { Users } from "lucide-react";

interface TeamListProps {
  teams: TeamWithMembers[];
}

export function TeamList({ teams }: TeamListProps) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-white">
        <p className="text-gray-500">No teams yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Create a team to collaborate with others.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teams.map((team) => (
        <Link
          key={team.id}
          href={`/teams/${team.id}`}
          className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{team.name}</h3>
              <p className="text-sm text-gray-500">
                {team.members.length} member{team.members.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {team.members.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
                  title={member.user.name ?? member.user.email}
                >
                  {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
                </div>
              ))}
              {team.members.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                  +{team.members.length - 3}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
