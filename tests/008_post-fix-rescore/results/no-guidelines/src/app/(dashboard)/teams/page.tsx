import React, { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getTeams } from "@/actions/team-actions";
import { TeamsClient } from "./teams-client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teams",
};

function TeamsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

async function TeamsContent() {
  const session = await auth();
  const result = await getTeams();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <TeamsClient
      initialTeams={result.data ?? []}
      currentUserId={session!.user!.id!}
    />
  );
}

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Teams</h1>
        <p className="mt-1 text-muted-foreground">
          Collaborate with your team members
        </p>
      </div>

      <Suspense fallback={<TeamsSkeleton />}>
        <TeamsContent />
      </Suspense>
    </div>
  );
}
