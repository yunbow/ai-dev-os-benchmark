"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Users, CheckSquare, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTeam } from "@/actions/teams";
import type { TeamRole } from "@prisma/client";

interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  role: TeamRole;
  _count: { members: number; tasks: number };
}

interface TeamsListProps {
  initialTeams: Team[];
  currentUserId: string;
}

const roleLabels: Record<TeamRole, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function TeamsList({ initialTeams, currentUserId }: TeamsListProps) {
  const [teams, setTeams] = useState(initialTeams);
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError("");

    startTransition(async () => {
      const result = await createTeam(formData);
      if (!result.success) {
        setError(result.error);
      } else {
        setTeams((prev) => [
          ...prev,
          {
            id: result.data.id,
            name: result.data.name,
            ownerId: currentUserId,
            createdAt: new Date(),
            role: "OWNER" as TeamRole,
            _count: { members: 1, tasks: 0 },
          },
        ]);
        toast.success("Team created");
        setCreateOpen(false);
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
              <DialogDescription>
                Create a new team to collaborate with your teammates.
              </DialogDescription>
            </DialogHeader>
            <form id="create-team-form" onSubmit={handleCreate} className="space-y-4" noValidate>
              {error && <p role="alert" className="text-sm text-[var(--color-destructive)]">{error}</p>}
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input id="team-name" name="name" maxLength={100} required placeholder="My Team" />
              </div>
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" form="create-team-form" disabled={isPending}>
                {isPending ? "Creating..." : "Create Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted-foreground)]">
          <Users className="h-12 w-12 mb-4 opacity-30" aria-hidden="true" />
          <p className="text-lg font-medium">No teams yet</p>
          <p className="text-sm mt-1">Create or join a team to collaborate.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/dashboard/teams/${team.id}`}
                className="block rounded-lg border bg-[var(--color-card)] p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <div className="flex items-start justify-between">
                  <h2 className="font-semibold text-lg">{team.name}</h2>
                  <Badge variant={team.role === "OWNER" ? "default" : "secondary"} className="text-xs">
                    {team.role === "OWNER" && <Crown className="mr-1 h-3 w-3" aria-hidden="true" />}
                    {roleLabels[team.role]}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-[var(--color-muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {team._count.members} member{team._count.members !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckSquare className="h-4 w-4" aria-hidden="true" />
                    {team._count.tasks} task{team._count.tasks !== 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
