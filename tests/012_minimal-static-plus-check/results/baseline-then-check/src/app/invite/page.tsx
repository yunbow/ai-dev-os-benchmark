import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { acceptInvitation } from "@/lib/actions/teams";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckSquare, Users } from "lucide-react";
import { AcceptInviteButton } from "./accept-invite-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team Invitation" };

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or missing.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/">Go home</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  // Check invitation validity
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { team: true, sender: { select: { name: true } } },
  });

  if (!invitation || invitation.usedAt || new Date() > invitation.expiresAt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation expired</CardTitle>
            <CardDescription>
              This invitation has expired or has already been used.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/">Go home</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  const session = await auth();

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
            <CheckSquare className="h-8 w-8 text-primary" aria-hidden="true" />
            TaskFlow
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
            </div>
            <CardTitle>You&apos;re invited!</CardTitle>
            <CardDescription>
              {invitation.sender.name || "Someone"} has invited you to join{" "}
              <strong>{invitation.team.name}</strong> as a{" "}
              {invitation.role.charAt(0) + invitation.role.slice(1).toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Invited email: <strong>{invitation.email}</strong>
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            {session?.user ? (
              <AcceptInviteButton token={token} teamId={invitation.teamId} />
            ) : (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  You need to sign in or create an account to accept this invitation.
                </p>
                <Button asChild className="w-full">
                  <Link href={`/auth/login?callbackUrl=/invite?token=${token}`}>
                    Sign in to accept
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/auth/register?callbackUrl=/invite?token=${token}`}>
                    Create account
                  </Link>
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
