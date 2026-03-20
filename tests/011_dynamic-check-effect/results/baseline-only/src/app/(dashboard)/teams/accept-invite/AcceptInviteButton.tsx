"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { acceptInviteAction } from "@/actions/team";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const result = await acceptInviteAction(token);
      if (result.success) {
        toast({ title: "Welcome to the team!" });
        router.push(`/teams/${result.data.teamId}`);
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleAccept} disabled={isLoading} size="lg" className="w-full">
      {isLoading ? "Accepting..." : "Accept Invitation"}
    </Button>
  );
}
