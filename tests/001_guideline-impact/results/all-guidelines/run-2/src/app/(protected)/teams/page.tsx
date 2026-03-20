"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getTeamsAction, createTeamAction } from "@/features/teams/server/team-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/common/loading-button";
import { Plus, Users, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTeamSchema } from "@/features/teams/schema/team-schema";
import type { z } from "zod";
import type { Team } from "@prisma/client";

type TeamWithCount = Team & { _count: { members: number; tasks: number } };

export default function TeamsPage() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<TeamWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const form = useForm<z.infer<typeof CreateTeamSchema>>({
    resolver: zodResolver(CreateTeamSchema),
    defaultValues: { name: "" },
  });

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const result = await getTeamsAction();
    if (result.success) {
      setTeams(result.data.teams as TeamWithCount[]);
    } else {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const onSubmit = async (data: z.infer<typeof CreateTeamSchema>) => {
    const result = await createTeamAction(data);
    if (result.success) {
      toast({ title: "Team created successfully" });
      form.reset();
      setShowCreateDialog(false);
      fetchTeams();
    } else {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Team
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No teams yet"
          description="Create a team to collaborate with others."
          action={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Team
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {team._count?.members ?? 0} member{(team._count?.members ?? 0) !== 1 ? "s" : ""} ·{" "}
                    {team._count?.tasks ?? 0} task{(team._count?.tasks ?? 0) !== 1 ? "s" : ""}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input id="name" placeholder="e.g. Engineering" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <LoadingButton type="submit" loading={form.formState.isSubmitting}>
                Create Team
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
