import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AcceptInviteButton } from "@/components/teams/accept-invite-button";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team Invitation - TaskFlow" };

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function InvitePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) redirect("/login");

  const session = await auth();
  if (!session) redirect(`/login?callbackUrl=/invite?token=${encodeURIComponent(token)}`);

  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: { team: { select: { name: true } } },
  });

  const isValid = invitation && !invitation.usedAt && invitation.expiresAt > new Date();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-muted)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Team Invitation</CardTitle>
          <CardDescription>
            {isValid
              ? `You've been invited to join ${invitation.team.name}`
              : "This invitation is invalid or has expired"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isValid ? (
            <AcceptInviteButton token={token} teamName={invitation.team.name} />
          ) : (
            <p className="text-center text-sm text-[var(--color-muted-foreground)]">
              Please ask for a new invitation link.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
