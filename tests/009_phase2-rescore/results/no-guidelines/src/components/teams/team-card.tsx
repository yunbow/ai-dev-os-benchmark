"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CheckSquare, ArrowRight } from "lucide-react";
import { TeamRole } from "@prisma/client";

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    description?: string | null;
    members: Array<{
      role: TeamRole;
      user: { id: string; name?: string | null; email: string };
    }>;
    _count: { tasks: number };
    currentUserRole?: TeamRole;
  };
  currentUserId: string;
}

const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function TeamCard({ team, currentUserId }: TeamCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{team.name}</CardTitle>
          {team.currentUserRole && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {ROLE_LABELS[team.currentUserRole]}
            </Badge>
          )}
        </div>
        {team.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{team.description}</p>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {team.members.length} member{team.members.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
            {team._count.tasks} task{team._count.tasks !== 1 ? "s" : ""}
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" size="sm" className="w-full gap-1" asChild>
          <Link href={`/teams/${team.id}`}>
            View Team
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
