"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users, ClipboardList, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { TeamForm } from "./team-form";
import { toast } from "@/hooks/use-toast";
import type { TeamWithMembers } from "../server/team-actions";
import type { Team } from "@prisma/client";

interface TeamListProps {
  initialTeams: TeamWithMembers[];
}

export function TeamList({ initialTeams }: TeamListProps) {
  const [teams, setTeams] = useState(initialTeams);
  const [isCreating, setIsCreating] = useState(false);

  const handleTeamCreated = (team: Team) => {
    // We need to fetch full team data - for now add with empty members
    setTeams((prev) => [
      ...prev,
      {
        ...team,
        members: [],
        _count: { tasks: 0 },
      },
    ]);
    setIsCreating(false);
    toast({ title: `Team "${team.name}" created!` });
  };

  if (teams.length === 0 && !isCreating) {
    return (
      <>
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create a team to collaborate with others on tasks."
          action={
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Team
            </Button>
          }
        />
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
            </DialogHeader>
            <TeamForm
              onSuccess={handleTeamCreated}
              onCancel={() => setIsCreating(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {teams.length} team{teams.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Team
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Link key={team.id} href={`/teams/${team.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{team.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList className="h-4 w-4" />
                    {team._count.tasks} task{team._count.tasks !== 1 ? "s" : ""}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
          </DialogHeader>
          <TeamForm
            onSuccess={handleTeamCreated}
            onCancel={() => setIsCreating(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
