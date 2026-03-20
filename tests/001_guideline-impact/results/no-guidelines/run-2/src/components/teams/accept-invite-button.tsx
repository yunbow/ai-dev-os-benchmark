"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/actions/teams";

interface AcceptInviteButtonProps {
  token: string;
  teamName: string;
}

export function AcceptInviteButton({ token, teamName }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptInvitation(token);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(`Joined ${teamName}!`);
        router.push(`/dashboard/teams/${result.data.teamId}`);
      }
    });
  }

  return (
    <div className="space-y-3">
      <Button className="w-full" onClick={handleAccept} disabled={isPending} aria-busy={isPending}>
        {isPending ? "Joining..." : `Join ${teamName}`}
      </Button>
      <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
        Decline
      </Button>
    </div>
  );
}
