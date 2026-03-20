import { Suspense, useState } from "react";
import { auth } from "@/lib/auth";
import { getTeams } from "@/lib/actions/teams";
import { TeamCard } from "@/components/teams/team-card";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamsClient } from "./teams-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Teams" };

async function TeamsContent({ userId }: { userId: string }) {
  const result = await getTeams();
  const teams = result.success ? result.data : [];
  return <TeamsClient initialTeams={teams} currentUserId={userId} />;
}

export default async function TeamsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teams</h1>
        <p className="text-muted-foreground">
          Manage your teams and collaborate with others
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        }
      >
        <TeamsContent userId={userId} />
      </Suspense>
    </div>
  );
}
