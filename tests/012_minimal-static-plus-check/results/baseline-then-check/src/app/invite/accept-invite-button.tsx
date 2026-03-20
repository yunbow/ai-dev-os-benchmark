"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/lib/actions/teams";
import { toast } from "@/hooks/use-toast";

interface AcceptInviteButtonProps {
  token: string;
  teamId: string;
}

export function AcceptInviteButton({ token, teamId }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptInvitation(token);
      if (result.success) {
        toast({ title: "You've joined the team!" });
        router.push(`/dashboard/teams/${result.data.teamId}`);
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Button onClick={handleAccept} disabled={isPending} className="w-full">
      {isPending ? "Accepting..." : "Accept invitation"}
    </Button>
  );
}
