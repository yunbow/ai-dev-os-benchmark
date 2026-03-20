import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserTeams } from "@/features/team/services/team-service";
import { Plus, Users, Crown, Eye } from "lucide-react";
import { TeamRole } from "@prisma/client";
import { CreateTeamClient } from "./CreateTeamClient";

export const metadata: Metadata = { title: "Teams" };

const roleIcons: Record<TeamRole, React.ReactNode> = {
  OWNER: <Crown className="h-3 w-3" />,
  MEMBER: <Users className="h-3 w-3" />,
  VIEWER: <Eye className="h-3 w-3" />,
};

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const teams = await getUserTeams(session.user.id);

  return (
    <div className="flex flex-col overflow-hidden">
      <Header title="Teams" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Your Teams</h2>
              <p className="text-sm text-muted-foreground">
                Collaborate with others on shared tasks
              </p>
            </div>
            <CreateTeamClient />
          </div>

          {teams.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No teams yet</p>
                <p className="text-sm text-muted-foreground">
                  Create a team to start collaborating
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {teams.map((team) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.userRole && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            {roleIcons[team.userRole]}
                            {team.userRole.charAt(0) + team.userRole.slice(1).toLowerCase()}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {team._count.members}{" "}
                        {team._count.members === 1 ? "member" : "members"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
