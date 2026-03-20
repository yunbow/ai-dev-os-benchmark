import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { TeamRole } from "@prisma/client";

interface TeamItem {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  ownerId: string;
  role: TeamRole;
  _count: { members: number; tasks: number };
}

interface TeamListProps {
  teams: TeamItem[];
}

const roleColors: Record<TeamRole, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  MEMBER: "bg-blue-100 text-blue-700",
  VIEWER: "bg-gray-100 text-gray-600",
};

export function TeamList({ teams }: TeamListProps) {
  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="text-5xl mb-4" aria-hidden="true">👥</div>
          <h3 className="text-lg font-medium text-gray-900">No teams yet</h3>
          <p className="text-gray-500 mt-1">Create or join a team to collaborate</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
      {teams.map((team) => (
        <Link key={team.id} href={`/teams/${team.id}`} role="listitem">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{team.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[team.role]}`}>
                  {team.role}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {team.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{team.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {team._count.members} member{team._count.members !== 1 ? "s" : ""}
                </span>
                <span>{team._count.tasks} task{team._count.tasks !== 1 ? "s" : ""}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Created {formatDate(team.createdAt)}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
