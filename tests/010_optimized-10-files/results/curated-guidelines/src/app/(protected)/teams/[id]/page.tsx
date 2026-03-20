import { getTeam } from "@/features/teams/server/team-actions";
import { TeamDetailClient } from "@/features/teams/components/team-detail-client";
import { notFound } from "next/navigation";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTeam(id);

  if (!result.success) {
    if (result.error.code === "NOT_FOUND" || result.error.code === "FORBIDDEN") notFound();
    throw new Error("Failed to load team");
  }

  return <TeamDetailClient team={result.data} />;
}
