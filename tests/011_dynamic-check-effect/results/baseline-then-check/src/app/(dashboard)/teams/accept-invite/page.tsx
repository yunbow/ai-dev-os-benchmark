"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { acceptTeamInvitation } from "@/actions/team";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleAccept() {
    setStatus("loading");
    const result = await acceptTeamInvitation(token);
    if (result.success) {
      setStatus("success");
      setTimeout(() => router.push("/teams"), 2000);
    } else {
      setStatus("error");
      setErrorMessage(result.error);
    }
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="max-w-sm w-full text-center">
          <CardHeader>
            <CardTitle>Invalid invitation</CardTitle>
            <CardDescription>This invitation link is invalid.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <Card className="max-w-sm w-full text-center">
        <CardHeader>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>You&apos;ve been invited to join a team on TaskFlow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <p className="text-green-600 text-sm" role="status">
              You&apos;ve joined the team! Redirecting...
            </p>
          )}
          {status === "error" && (
            <p className="text-destructive text-sm" role="alert">{errorMessage}</p>
          )}
          {status !== "success" && (
            <Button onClick={handleAccept} disabled={status === "loading"} className="w-full">
              {status === "loading" ? "Accepting..." : "Accept invitation"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
