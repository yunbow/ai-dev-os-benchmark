import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, CheckSquare } from "lucide-react";

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    description: string | null;
    members: {
      id: string;
      role: string;
      user: { id: string; name: string | null; email: string; image: string | null };
    }[];
    _count: { tasks: number };
  };
  currentUserId: string;
}

export function TeamCard({ team, currentUserId }: TeamCardProps) {
  const currentMember = team.members.find((m) => m.user.id === currentUserId);
  const roleLabel =
    currentMember?.role === "OWNER"
      ? "Owner"
      : currentMember?.role === "MEMBER"
      ? "Member"
      : "Viewer";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">
              <Link
                href={`/dashboard/teams/${team.id}`}
                className="hover:underline"
                aria-label={`View team: ${team.name}`}
              >
                {team.name}
              </Link>
            </CardTitle>
            {team.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {team.description}
              </p>
            )}
          </div>
          <Badge variant="outline" className="ml-2 shrink-0">
            {roleLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2" aria-label="Team members">
              {team.members.slice(0, 4).map((member) => (
                <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {member.user.name?.[0]?.toUpperCase() ||
                      member.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {team.members.length} member{team.members.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{team._count.tasks} task{team._count.tasks !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
