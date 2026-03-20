"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { TeamCard } from "@/components/teams/team-card";
import { createTeam } from "@/lib/actions/teams";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string | null;
  members: {
    id: string;
    role: string;
    user: { id: string; name: string | null; email: string; image: string | null };
  }[];
  _count: { tasks: number };
}

interface TeamsClientProps {
  initialTeams: Team[];
  currentUserId: string;
}

export function TeamsClient({ initialTeams, currentUserId }: TeamsClientProps) {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    startTransition(async () => {
      const result = await createTeam({ name, description: description || undefined });

      if (result.success) {
        setTeams((prev) => [...prev, result.data as Team]);
        setName("");
        setDescription("");
        setOpen(false);
        toast({ title: "Team created successfully" });
        router.push(`/dashboard/teams/${result.data.id}`);
      } else {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {teams.length} team{teams.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} noValidate>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label htmlFor="team-name">
                    Team Name{" "}
                    <span aria-hidden="true" className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="team-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Awesome Team"
                    required
                    aria-required="true"
                    aria-invalid={!!fieldErrors.name}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-destructive" role="alert">
                      {fieldErrors.name[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="team-description">Description</Label>
                  <Textarea
                    id="team-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this team work on?"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !name}>
                  {isPending ? "Creating..." : "Create Team"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground border rounded-lg"
          role="status"
        >
          <p className="text-lg font-medium">No teams yet</p>
          <p className="text-sm mt-1">
            Create or join a team to collaborate with others
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          aria-label="Team list"
        >
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}
