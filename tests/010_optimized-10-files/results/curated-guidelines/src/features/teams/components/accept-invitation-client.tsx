"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { acceptInvitation } from "../server/team-actions";

export function AcceptInvitationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid invitation link.");
      return;
    }

    setStatus("loading");
    acceptInvitation({ token }).then((result) => {
      if (!result.success) {
        setStatus("error");
        setErrorMessage(result.error.message);
        return;
      }
      setStatus("success");
      toast.success("You've joined the team!");
      setTimeout(() => router.push(`/teams/${result.data.teamId}`), 1500);
    });
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="py-4">
        <div className="animate-pulse text-gray-500 text-sm">Accepting invitation...</div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="py-4">
        <p className="text-green-700 text-sm font-medium">
          You&apos;ve successfully joined the team! Redirecting...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="py-4">
        <p className="text-red-600 text-sm">{errorMessage}</p>
        <a href="/teams" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Go to Teams
        </a>
      </div>
    );
  }

  return null;
}
