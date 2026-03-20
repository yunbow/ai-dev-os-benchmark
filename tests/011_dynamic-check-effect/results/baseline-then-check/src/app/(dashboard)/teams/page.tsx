import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTeam } from "@/actions/team";
import { Plus, Users } from "lucide-react";
import Link from "next/link";

async function TeamList({ userId }: { userId: string }) {
  const teams = await db.team.findMany({
    where: { members: { some: { userId } } },
    include: {
      _count: { select: { members: true, tasks: true } },
      members: {
        where: { userId },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (teams.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12 text-sm">
        No teams yet. Create or join a team!
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Your teams">
      {teams.map((team) => {
        const myRole = team.members[0]?.role;
        return (
          <li key={team.id}>
            <Link href={`/teams/${team.id}`} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-start gap-3 pb-2">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{team.name}</CardTitle>
                    {myRole && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {myRole}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{team._count.members} member{team._count.members !== 1 ? "s" : ""}</span>
                    <span>{team._count.tasks} task{team._count.tasks !== 1 ? "s" : ""}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

async function CreateTeamForm() {
  "use server"; // This is handled via action
  return null;
}

export default async function TeamsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
            </DialogHeader>
            <form action={createTeam} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="team-name">Team name</Label>
                <Input id="team-name" name="name" maxLength={100} required aria-required="true" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="team-desc">Description</Label>
                <Input id="team-desc" name="description" maxLength={500} />
              </div>
              <Button type="submit" className="w-full">Create Team</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        }
      >
        <TeamList userId={userId} />
      </Suspense>
    </div>
  );
}
