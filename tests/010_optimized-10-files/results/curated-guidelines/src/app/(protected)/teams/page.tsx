import { listTeams } from "@/features/teams/server/team-actions";
import { TeamsPageClient } from "@/features/teams/components/teams-page-client";

export const metadata = { title: "Teams" };

export default async function TeamsPage() {
  const result = await listTeams();
  if (!result.success) throw new Error("Failed to load teams");

  return <TeamsPageClient initialTeams={result.data} />;
}
