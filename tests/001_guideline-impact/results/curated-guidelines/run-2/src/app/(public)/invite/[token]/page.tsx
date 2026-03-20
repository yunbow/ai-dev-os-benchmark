import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { acceptInvitation } from "@/features/teams/server/team-actions";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await auth();

  // Check if invitation exists and is valid
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: { team: true },
  });

  if (!invitation || invitation.usedAt || new Date() > invitation.expiresAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                This invitation link is invalid, expired, or has already been used.
              </AlertDescription>
            </Alert>
            <Button asChild className="mt-4">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not logged in, redirect to login with callback
  if (!session?.user) {
    redirect(`/login?callbackUrl=/invite/${token}`);
  }

  // Accept the invitation
  const result = await acceptInvitation(token);

  if (!result.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{result.error.message}</AlertDescription>
            </Alert>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  redirect(`/teams/${result.data.teamId}`);
}
