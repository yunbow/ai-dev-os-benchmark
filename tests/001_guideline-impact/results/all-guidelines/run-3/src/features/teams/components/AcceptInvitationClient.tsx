"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation } from "../actions";
import { Users, CheckCircle, AlertCircle } from "lucide-react";

interface AcceptInvitationClientProps {
  token: string;
}

export default function AcceptInvitationClient({ token }: AcceptInvitationClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleAccept = async () => {
    setStatus("loading");
    const result = await acceptInvitation({ token });

    if (result.success) {
      setStatus("success");
      setTimeout(() => router.push("/teams"), 2000);
    } else {
      setStatus("error");
      setErrorMessage(result.error.message);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center space-y-4">
      <div className="flex justify-center">
        <Users className="h-12 w-12 text-blue-500" aria-hidden="true" />
      </div>

      {status === "success" ? (
        <>
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-gray-900">Invitation accepted!</h1>
          <p className="text-sm text-gray-500">
            Welcome to the team. Redirecting you to Teams...
          </p>
        </>
      ) : status === "error" ? (
        <>
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-gray-900">Could not accept invitation</h1>
          <p className="text-sm text-red-600">{errorMessage}</p>
          <button
            onClick={() => router.push("/teams")}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:underline focus:outline-none"
          >
            Go to Teams
          </button>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold text-gray-900">Team Invitation</h1>
          <p className="text-sm text-gray-500">
            You&apos;ve been invited to join a team on TaskFlow. Accept the invitation to get started.
          </p>
          <button
            onClick={handleAccept}
            disabled={status === "loading"}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {status === "loading" ? "Accepting..." : "Accept Invitation"}
          </button>
        </>
      )}
    </div>
  );
}
