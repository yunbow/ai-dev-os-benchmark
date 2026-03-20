"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { acceptInvitation } from "@/lib/actions/team";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params: paramsPromise }: InvitePageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [token, setToken] = useState<string | null>(null);

  // Resolve params
  paramsPromise.then((p) => setToken(p.token));

  async function handleAccept() {
    if (!token) return;
    startTransition(async () => {
      const result = await acceptInvitation(token);
      if (result.success) {
        toast({ title: "Welcome to the team!" });
        router.push("/teams");
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>You&apos;ve been invited to join a team on TaskFlow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Click the button below to accept this invitation and join the team.
          </p>
          <Button onClick={handleAccept} disabled={isPending || !token} className="w-full">
            {isPending ? "Accepting..." : "Accept Invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
