import { notFound, redirect } from "next/navigation";
import { acceptTeamInvitationAction } from "@/features/teams/server/team-actions";

interface InvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: InvitePageProps) {
  const { token } = await searchParams;
  if (!token) notFound();

  const result = await acceptTeamInvitationAction({ token });

  if (!result.success) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold">Invalid Invitation</h1>
        <p className="mt-2 text-muted-foreground">{result.error.message}</p>
      </main>
    );
  }

  redirect(`/teams/${result.data.teamId}`);
}
