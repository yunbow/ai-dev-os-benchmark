"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { acceptInvitationAction } from "@/actions/teams";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function InvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid invitation</CardTitle>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className="text-primary hover:underline text-sm">
              Go to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptInvitationAction(token);
      if (!result.success) {
        setError(result.error);
      } else {
        setAccepted(true);
        setTimeout(() => {
          router.push(`/teams/${result.data.teamId}`);
        }, 1500);
      }
    });
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation accepted!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Redirecting to your team...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Team Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              You&apos;ve been invited to join a team on TaskFlow. Accept the invitation to get started.
            </p>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button onClick={handleAccept} disabled={isPending || !!error}>
            {isPending ? "Accepting..." : "Accept Invitation"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tasks">Maybe later</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
