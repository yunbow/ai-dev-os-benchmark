"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { createTeam } from "@/features/teams/server/team-actions";
import {
  createTeamSchema,
  type CreateTeamInput,
} from "@/features/teams/schema/team-schema";
import type { TeamRole } from "@prisma/client";

type TeamItem = {
  id: string;
  name: string;
  role: TeamRole;
  _count: { members: number; tasks: number };
};

const roleLabels: Record<TeamRole, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

interface TeamsClientProps {
  initialTeams: TeamItem[];
}

export function TeamsClient({ initialTeams }: TeamsClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: CreateTeamInput) => {
    setServerError(null);
    const result = await createTeam(data);

    if (!result.success) {
      setServerError(result.error.message);
      return;
    }

    form.reset();
    setOpen(false);
    router.push(`/teams/${result.data.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {serverError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name *</Label>
                <Input
                  id="team-name"
                  placeholder="Enter team name"
                  {...form.register("name")}
                  aria-invalid={!!form.formState.errors.name}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive" role="alert">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  )}
                  Create Team
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {initialTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold">No teams yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a team to collaborate with others
          </p>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Teams">
          {initialTeams.map((team) => (
            <li key={team.id}>
              <Card className="hover:shadow-md transition-shadow">
                <Link href={`/teams/${team.id}`} className="block">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team._count.members} member{team._count.members !== 1 ? "s" : ""} ·{" "}
                          {team._count.tasks} task{team._count.tasks !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{roleLabels[team.role]}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
