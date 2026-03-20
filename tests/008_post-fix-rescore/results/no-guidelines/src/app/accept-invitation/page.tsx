import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AcceptInvitationClient } from "./accept-invitation-client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AcceptInvitationPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitationPage({
  searchParams,
}: AcceptInvitationPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Invalid invitation</h2>
              <p className="text-sm text-muted-foreground">
                This invitation link is invalid.
              </p>
              <Link href="/">
                <Button>Go to TaskFlow</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invitation = await db.teamInvitation.findUnique({
    where: { token },
    include: { team: { select: { name: true } } },
  });

  if (!invitation || invitation.used || new Date() > invitation.expiresAt) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Invitation expired</h2>
              <p className="text-sm text-muted-foreground">
                This invitation has expired or has already been used.
              </p>
              <Link href="/">
                <Button>Go to TaskFlow</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const session = await auth();

  return (
    <AcceptInvitationClient
      token={token}
      teamName={invitation.team.name}
      role={invitation.role}
      isLoggedIn={!!session}
      userEmail={session?.user?.email}
    />
  );
}
