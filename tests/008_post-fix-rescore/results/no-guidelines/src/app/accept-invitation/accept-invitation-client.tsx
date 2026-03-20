"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import type { TeamRole } from "@prisma/client";

interface AcceptInvitationClientProps {
  token: string;
  teamName: string;
  role: TeamRole;
  isLoggedIn: boolean;
  userEmail?: string | null;
}

const roleLabels: Record<TeamRole, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export function AcceptInvitationClient({
  token,
  teamName,
  role,
  isLoggedIn,
  userEmail,
}: AcceptInvitationClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/accept-invitation?token=${token}`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setAccepted(true);
        toast({
          variant: "success",
          title: "Welcome to the team!",
          description: `You've joined ${teamName} as a ${roleLabels[role]}.`,
        });
        setTimeout(() => router.push("/teams"), 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error?.message || "Failed to accept invitation",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h2 className="text-xl font-semibold">Welcome to {teamName}!</h2>
              <p className="text-sm text-muted-foreground">
                Redirecting you to teams...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-xl font-bold">TF</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">TaskFlow</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Invitation
            </CardTitle>
            <CardDescription>
              You&apos;ve been invited to join a team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Team</span>
                <span className="text-sm">{teamName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your role</span>
                <Badge variant="secondary">{roleLabels[role]}</Badge>
              </div>
            </div>

            {!isLoggedIn && (
              <p className="text-sm text-muted-foreground text-center">
                You need to sign in or create an account to accept this
                invitation.
              </p>
            )}

            {isLoggedIn && userEmail && (
              <p className="text-sm text-muted-foreground text-center">
                Accepting as <strong>{userEmail}</strong>
              </p>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Decline
              </Button>
            </Link>
            <Button
              className="flex-1"
              onClick={handleAccept}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLoggedIn ? "Accepting..." : "Sign in..."}
                </>
              ) : isLoggedIn ? (
                "Accept invitation"
              ) : (
                "Sign in to accept"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
