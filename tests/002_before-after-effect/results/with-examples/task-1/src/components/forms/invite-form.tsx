"use client";

import { useState } from "react";
import { inviteTeamMember } from "@/lib/actions/teams";
import { useRouter } from "next/navigation";

interface InviteFormProps {
  teamId: string;
}

export function InviteForm({ teamId }: InviteFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("teamId", teamId);

    const result = await inviteTeamMember(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push(`/teams/${teamId}`), 2000);
  }

  if (success) {
    return (
      <div className="rounded bg-green-50 p-4 text-sm text-green-700">
        Invitation sent successfully! Redirecting...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="colleague@example.com"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send invitation"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/teams/${teamId}`)}
          className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
