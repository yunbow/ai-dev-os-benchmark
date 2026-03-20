"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TeamWithMembers, TEAM_ROLE_LABELS } from "../types/team-types";
import { deleteTeam } from "../server/team-actions";
import { TeamForm } from "./team-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Users, Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface TeamListProps {
  teams: TeamWithMembers[];
  currentUserId: string;
}

export function TeamList({ teams, currentUserId }: TeamListProps) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    const result = await deleteTeam(id);
    if (!result.success) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Team deleted" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Teams</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
            </DialogHeader>
            <TeamForm />
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create a team to collaborate with others"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const currentMember = team.members.find((m) => m.userId === currentUserId);
            const isOwner = currentMember?.role === "OWNER";

            return (
              <Card key={team.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{team.name}</CardTitle>
                    {currentMember && (
                      <Badge variant="outline" className="text-xs">
                        {TEAM_ROLE_LABELS[currentMember.role]}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/teams/${team.id}`}>
                      View Team
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(team.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
